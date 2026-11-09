// Team sign-in for /admin: an emailed link, then a signed cookie. No passwords to manage.
//   ADMIN_EMAILS  comma-separated team emails allowed in (e.g. "a@x.com,b@y.com"), or a whole domain ("@x.com")
//   ADMIN_SECRET  a long random string used to sign links and cookies (keep it secret)
import crypto from "node:crypto";

const COOKIE = "pls_admin";
const secret = () => {
  const s = process.env.ADMIN_SECRET;
  if (s && s.length >= 24) return s;
  if (!process.env.VERCEL) return "local-development-secret-not-for-production";
  throw Object.assign(new Error("The console isn’t set up yet (ADMIN_SECRET is missing)."), { status: 503 });
};
// Anyone with an @amalandcompany.com email can sign in, plus anyone listed in ADMIN_EMAILS.
export const DEFAULT_DOMAIN = "@amalandcompany.com";
export const admins = () => [DEFAULT_DOMAIN, ...(process.env.ADMIN_EMAILS || "").split(",")].map((s) => s.trim().toLowerCase()).filter(Boolean);
// An entry that starts with "@" lets in everyone at that domain, e.g. "@amalandcompany.com".
export const isAdmin = (email) => {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(e)) return false;
  return admins().some((a) => (a.startsWith("@") ? e.endsWith(a) : a === e));
};

const mac = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");
export function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return data + "." + mac(data);
}
export function verify(token, type) {
  const [data, sig] = String(token || "").split(".");
  if (!data || !sig) return null;
  const want = mac(data);
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  let p; try { p = JSON.parse(Buffer.from(data, "base64url").toString()); } catch { return null; }
  if (p.t !== type || !p.exp || Date.now() > p.exp || !isAdmin(p.e)) return null;
  return p;
}

export const linkToken = (email) => sign({ t: "link", e: email.toLowerCase(), exp: Date.now() + 15 * 60e3, n: crypto.randomBytes(6).toString("base64url") });

function cookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((c) => { const i = c.indexOf("="); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
export function setSession(res, email) {
  const days = 14, token = sign({ t: "s", e: email.toLowerCase(), exp: Date.now() + days * 864e5 });
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${days * 86400}${process.env.VERCEL ? "; Secure" : ""}`);
}
export function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? "; Secure" : ""}`);
}
// The signed-in team member's email, or null.
export function sessionEmail(req) {
  const p = verify(cookies(req)[COOKIE], "s");
  return p ? p.e : null;
}
