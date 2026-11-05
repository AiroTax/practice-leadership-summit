// POST /api/prework — saves a practice's pre-work, matched by registration number.
import { W, TABLES, createRecord, findPracticeByNumber, readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";

const PRODUCTION = ["Under $100k", "$100k–$200k", "$200k–$400k", "$400k–$800k", "Over $800k"];
const CALL = ["Dec 14–18, mornings", "Dec 14–18, afternoons", "Dec 14–18, evenings", "Jan 4–6 (late registrants)"];
const num = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : undefined; };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
  const b = readBody(req);
  if (str(b.website)) return send(res, 200, { ok: true });
  if (rateLimited(req)) return send(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes and try again." });

  const number = parseInt(String(b.number || "").replace(/[^0-9]/g, ""), 10);
  const practice = str(b.practice, 120), email = str(b.email, 120), challenges = str(b.challenges, 3000);
  if (!number) return send(res, 400, { ok: false, error: "Please add your registration number from the confirmation email." });
  if (!practice || !isEmail(email) || !challenges) return send(res, 400, { ok: false, error: "Please add your practice name, a valid email and your top three challenges." });

  try {
    const match = await findPracticeByNumber(number);
    if (!match) return send(res, 404, { ok: false, error: `We couldn't find registration #${number}. Check the number in your confirmation email, or contact us.` });

    const fields = {
      [W.practice]: practice, [W.number]: number, [W.email]: email,
      [W.years]: num(b.years, 80), [W.locations]: num(b.locations, 50), [W.teamSize]: num(b.teamSize, 500), [W.newPatients]: num(b.newPatients, 5000),
      [W.payerMix]: str(b.payerMix), [W.production]: PRODUCTION.includes(b.production) ? b.production : undefined,
      [W.technology]: str(b.technology, 300), [W.compared]: str(b.compared, 300), [W.challenges]: challenges,
      [W.goodWeekend]: str(b.goodWeekend, 3000), [W.callTime]: CALL.includes(b.callTime) ? b.callTime : undefined,
    };
    Object.keys(fields).forEach((k) => { if (fields[k] === undefined || fields[k] === "") delete fields[k]; });
    await createRecord(TABLES.prework, fields);
    return send(res, 200, { ok: true });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
