// /api/auth — team sign-in for the console.
//   POST {email}          emails a sign-in link if the address is on the team list
//   GET  ?t=<token>       opens the link: sets the session cookie and goes to /admin
//   POST {logout:true}    signs out
import { readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";
import { isAdmin, admins, linkToken, verify, setSession, clearSession, sessionEmail } from "./_lib/auth.js";
import { sendSignIn } from "./_lib/notify.js";
import { SITE } from "./_lib/email.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const t = String((req.query && req.query.t) || new URL(req.url, "http://x").searchParams.get("t") || "");
      const p = verify(t, "link");
      res.statusCode = 302;
      if (!p) { res.setHeader("Location", "/admin?signin=expired"); return res.end(); }
      setSession(res, p.e);
      res.setHeader("Location", "/admin"); return res.end();
    }
    if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
    const b = readBody(req);
    if (b.logout) { clearSession(res); return send(res, 200, { ok: true }); }
    if (b.me) return send(res, 200, { ok: true, email: sessionEmail(req) });
    if (rateLimited(req)) return send(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes." });
    const email = str(b.email, 160).toLowerCase();
    if (!isEmail(email)) return send(res, 400, { ok: false, error: "Please enter your email." });
    if (!admins().length) return send(res, 503, { ok: false, error: "No team members are set up yet. Add ADMIN_EMAILS in Vercel." });
    let devLink;
    if (isAdmin(email)) {
      const base = process.env.VERCEL ? SITE : `http://${req.headers.host}`;
      const link = `${base}/api/auth?t=${encodeURIComponent(linkToken(email))}`;
      const r = await sendSignIn(email, link);
      if (!r.ok) return send(res, 502, { ok: false, error: "We couldn’t send the email. The email service said: " + (r.error || "no reason given") });
      if (r.local && !process.env.VERCEL) devLink = link;
    }
    // Same answer either way, so the form doesn't reveal who is on the team.
    return send(res, 200, { ok: true, devLink });
  } catch (e) {
    console.error(e); return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong." });
  }
}
