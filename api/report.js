// GET /api/report?k=<key> — the data behind an office's Practice Snapshot.
// Works only when the team has marked the report Ready or Sent in the console; the key is the
// private part of the link sent to the office. Emails and phone numbers are never returned.
import { send } from "./_lib/airtable.js";
import { reportByKey } from "./_lib/store.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return send(res, 405, { ok: false, error: "Use GET." });
    const k = String((req.query && req.query.k) || new URL(req.url, "http://x").searchParams.get("k") || "");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return send(res, 404, { ok: false, error: "This report link isn’t valid. Check the link in your email." });
    const report = await reportByKey(k);
    if (!report) return send(res, 404, { ok: false, error: "This report isn’t available. It may not be ready yet, or the link has changed." });
    res.setHeader("X-Robots-Tag", "noindex");
    return send(res, 200, { ok: true, report });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
