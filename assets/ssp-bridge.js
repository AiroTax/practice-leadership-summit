// Answers the site's /api/* calls in the browser when it is hosted on the Site Serving Platform.
// It runs the same code as the Vercel functions (the files under /api), with the store, mail and
// sign-in switched to the platform's /_ssp/* services. What anyone may read or change is enforced
// by the platform from ssp.json, not here:
//   website forms   save signed-out (create only, nothing read back)
//   report page     opens the office's encrypted copy from the public store
//   console         signs in with Google; admin and staff roles read and change the data
globalThis.process = globalThis.process || { env: {} };
const env = globalThis.process.env;
env.STORE_BACKEND = "ssp";
env.SITE_URL = location.origin;

const PUBLIC = ["register", "prework", "report", "stats"];
const TEAM_ROLES = ["admin", "staff"];
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

// A tiny stand-in for Node's req/res, enough for the handlers in /api.
async function runHandler(name, url, init) {
  const mod = await import(`/api/${name}.js`);
  const u = new URL(url, location.origin);
  let body = {};
  if (typeof init.body === "string") { try { body = JSON.parse(init.body); } catch { body = {}; } }
  const req = { method: (init.method || "GET").toUpperCase(), url: u.pathname + u.search, query: Object.fromEntries(u.searchParams), headers: { host: location.host }, body };
  return new Promise((resolve) => {
    const headers = {};
    const res = {
      statusCode: 200,
      setHeader(k, v) { headers[k] = v; },
      end(data) { resolve(new Response(data == null ? null : data, { status: res.statusCode, headers })); },
    };
    Promise.resolve(mod.default(req, res)).catch((e) => resolve(json(500, { ok: false, error: e.message || "Something went wrong." })));
  });
}

async function teamMember() {
  const { auth } = await import("/api/_lib/ssp.js");
  return auth.me();
}

export async function handle(url, init) {
  const name = (url.match(/^\/api\/([a-z]+)/) || [])[1] || "";
  const method = (init.method || "GET").toUpperCase();
  let body = {};
  if (typeof init.body === "string") { try { body = JSON.parse(init.body); } catch { body = {}; } }
  try {
    if (PUBLIC.includes(name)) { env.SSP_PUBLIC = "1"; return await runHandler(name, url, init); }
    env.SSP_PUBLIC = "";

    if (name === "auth") {
      const { auth } = await import("/api/_lib/ssp.js");
      if (body.logout) { await auth.logout(); return json(200, { ok: true }); }
      if (body.google) return json(200, { ok: true, url: await auth.google(body.redirect || location.href) });
      if (body.me) {
        const u = await teamMember();
        if (!u) return json(200, { ok: true, email: null, ssp: true });
        if (!TEAM_ROLES.includes(u.role)) return json(200, { ok: true, email: null, ssp: true, denied: u.email });
        return json(200, { ok: true, email: u.email, role: u.role, ssp: true });
      }
      return json(400, { ok: false, ssp: true, error: "On this site, sign in with the Google button." });
    }

    if (name === "admin") {
      const u = await teamMember();
      if (!u || !TEAM_ROLES.includes(u.role)) return json(401, { ok: false, error: "Please sign in." });
      const { consoleRequest } = await import("/api/_lib/team-desk.js");
      const [status, out] = await consoleRequest(method, method === "POST" ? body : null, u.email);
      return json(status, out);
    }

    return json(404, { ok: false, error: "Not found." });
  } catch (e) {
    console.error(e);
    return json(e.status && e.status < 600 ? e.status : 500, { ok: false, error: e.message || "Something went wrong." });
  }
}
