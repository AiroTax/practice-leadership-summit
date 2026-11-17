// GET /api/code?c=SUMMIT20 — whether a discount code can be used, and what it's worth, for the
// registration form's live check. Never lists codes; answers only about the one asked for.
import { send } from "./_lib/airtable.js";
import { checkCode } from "./_lib/codes.js";

export default async function handler(req, res) {
  try {
    const c = String((req.query && req.query.c) || new URL(req.url, "http://x").searchParams.get("c") || "").slice(0, 40);
    return send(res, 200, await checkCode(c));
  } catch (e) {
    return send(res, 200, { ok: false, reason: "unavailable" });
  }
}
