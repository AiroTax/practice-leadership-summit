// The Site Serving Platform (SSP) that hosts practice-leadership-summit.amalandco.com.
// It gives the site sign-in, a database (SSP.db), a small public key-value store (SSP.store)
// and outbound mail, all under /_ssp/* on the site's own address.
//
// This file works in two places:
//   in the browser   same-origin calls that ride the visitor's or team member's session cookie
//   in Node          the scheduled sweep (scripts/ssp-sweep.mjs), which signs every call with
//                    the site API key: SSP_SITE_API_KEY, SSP_SITE_DOMAIN, optionally SSP_BASE_URL
//
// Nothing here holds a secret in the browser: what a signed-in person may read or change is
// decided by the platform from the rules in ssp.json.

const inBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const env = () => (globalThis.process && globalThis.process.env) || {};

export const sspOn = () => env().STORE_BACKEND === "ssp";
export const sspPublic = () => sspOn() && env().SSP_PUBLIC === "1";
export const siteDomain = () => env().SSP_SITE_DOMAIN || (inBrowser ? location.hostname : "");
const base = () => (inBrowser ? "" : (env().SSP_BASE_URL || "https://" + siteDomain()).replace(/\/+$/, ""));
const fail = (msg, status = 502, extra = {}) => Object.assign(new Error(msg), { status, ...extra });

async function refreshOnce() {
  try { return (await fetch("/_ssp/auth/refresh", { method: "POST", credentials: "include" })).ok; } catch { return false; }
}

// One call to /_ssp/*. Returns the parsed JSON body, throws with the platform's message on failure.
export async function sspFetch(path, init = {}, { quiet401 = false } = {}) {
  const headers = { "Content-Type": "application/json", ...(init.headers || {}) };
  if (!inBrowser) {
    const key = env().SSP_SITE_API_KEY;
    if (!key) throw fail("SSP_SITE_API_KEY is not set.", 503);
    headers.Authorization = "Bearer " + key;
  }
  const go = () => fetch(base() + path, { ...init, headers, ...(inBrowser ? { credentials: "include" } : {}) });
  let res = await go();
  if (res.status === 401 && inBrowser && (await refreshOnce())) res = await go();
  const text = await res.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = { error: text.slice(0, 200) }; }
  if (!res.ok) {
    if (res.status === 401 && quiet401) return null;
    const detail = body && Array.isArray(body.errors) ? " (" + body.errors.join("; ") + ")" : "";
    if (res.status >= 500 || res.status === 400) console.error("SSP error", res.status, path, text.slice(0, 500));
    throw fail(((body && body.error) || `The platform answered ${res.status}`) + detail, res.status, { platform: true });
  }
  return body;
}

const enc = encodeURIComponent;
const col = (c) => `/_ssp/db/${enc(siteDomain())}/${enc(c)}`;

// SSP.db collections. Records come back as { id, data, created_at, updated_at }.
export const db = {
  async list(c) { const b = await sspFetch(col(c)); return (b && b.records) || []; },
  async get(c, id) { const b = await sspFetch(`${col(c)}/${enc(id)}`); return b && (b.record || b); },
  async create(c, data) { const b = await sspFetch(col(c), { method: "POST", body: JSON.stringify({ data }) }); return b && (b.record || b); },
  // PATCH replaces the whole data object, so callers pass the complete record.
  async replace(c, id, data) { const b = await sspFetch(`${col(c)}/${enc(id)}`, { method: "PATCH", body: JSON.stringify({ data }) }); return b && (b.record || b); },
  async remove(c, id) { await sspFetch(`${col(c)}/${enc(id)}`, { method: "DELETE" }); },
  // Signed-out website forms: create only, nothing is read back (ssp.json public_insert).
  async publicCreate(c, data, hp = "") {
    return sspFetch(`/_ssp/public/${enc(siteDomain())}/db/${enc(c)}`, { method: "POST", body: JSON.stringify({ data, hp }) });
  },
};

// SSP.store: anyone can read (and list) keys; only admin/staff can write. Never put plain
// private data here: the reports go in encrypted (see report-crypto.js).
export const kv = {
  async get(key) { const b = await sspFetch(`/_ssp/data/${enc(siteDomain())}/${enc(key)}`); return b ? b.value : null; },
  async set(key, value) { await sspFetch(`/_ssp/data/${enc(siteDomain())}/${enc(key)}`, { method: "PUT", body: JSON.stringify({ value }) }); },
};

// Outbound mail through the platform mailer. The platform wraps `html` in the site's mail
// template (Site settings → Mail), up to 20 recipients a message.
export async function sspMail({ to, subject, text, html, replyTo }) {
  return sspFetch(`/_ssp/mail/${enc(siteDomain())}/send`, { method: "POST", body: JSON.stringify({ to, subject, text, html, replyTo }) });
}

// Team sign-in (browser only).
export const auth = {
  async me() { const b = await sspFetch("/_ssp/auth/me", {}, { quiet401: true }).catch(() => null); const u = b && (b.user || b); return u && u.email ? u : null; },
  async google(redirectUrl) {
    const b = await sspFetch("/_ssp/auth/login-with-google", { method: "POST", body: JSON.stringify({ siteDomain: siteDomain(), redirectUrl }) });
    if (!b || !b.authUrl) throw fail("Sign-in didn’t return a Google link.");
    return b.authUrl;
  },
  async logout() { await sspFetch("/_ssp/auth/logout", { method: "POST" }).catch(() => {}); },
};
