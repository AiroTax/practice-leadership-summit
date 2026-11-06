// POST /api/prework — saves a practice's pre-work, matched by registration number.
// Which answers are accepted, and where they go in Airtable, comes from ./_lib/questions.js.
import { TABLES, createRecord, findPracticeByNumber, readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";
import { PREWORK, allQuestions } from "./_lib/questions.js";

const QUESTIONS = allQuestions(PREWORK);

function num(v, min, max) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

// Turns the submitted answers into Airtable fields, ignoring anything not in the question list.
export function prepareFields(b) {
  const fields = {};
  for (const q of QUESTIONS) {
    const v = b[q.k];
    switch (q.type) {
      case "text": case "email": case "textarea": case "url": {
        const s = str(v, q.max || 300); if (s) fields[q.f] = s; break;
      }
      case "number": {
        const n = num(v, q.min ?? 0, q.max ?? 1e6); if (n !== undefined) fields[q.f] = n; break;
      }
      case "choice": case "select": {
        if (q.opts.includes(v)) fields[q.f] = v; break;
      }
      case "multi": {
        const picked = (Array.isArray(v) ? v : []).filter((x) => q.opts.includes(x));
        const list = [...new Set(picked)].slice(0, q.pick || q.opts.length);
        if (list.length) fields[q.f] = list; break;
      }
      case "pct3": {
        const parts = [];
        for (const p of q.parts) {
          const n = num(b[p.k], 0, 100);
          if (n !== undefined) { fields[p.f] = Math.round(n); parts.push(`${p.label} ${Math.round(n)}%`); }
        }
        if (parts.length) fields[q.summary] = parts.join(" · ");
        break;
      }
      case "scores": {
        for (const p of q.parts) { const n = num(b[p.k], 1, 5); if (n !== undefined) fields[p.f] = Math.round(n); }
        break;
      }
      case "list3": {
        const items = (Array.isArray(v) ? v : []).map((x) => str(x, q.max || 200)).filter(Boolean).slice(0, 3);
        if (items.length) fields[q.f] = items.map((x, i) => `${i + 1}. ${x}`).join("\n");
        break;
      }
    }
  }
  return fields;
}

export default async function handler(req, res) {
  try { return await handle(req, res); }
  catch (e) { console.error("Unexpected error", e); return send(res, 500, { ok: false, error: "Something went wrong on our side. Please try again in a minute." }); }
}

async function handle(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
  const b = readBody(req);
  if (str(b.hp)) return send(res, 200, { ok: true });
  if (rateLimited(req)) return send(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes and try again." });

  const number = parseInt(String(b.number || "").replace(/[^0-9]/g, ""), 10);
  if (!number) return send(res, 400, { ok: false, error: "Please add your registration number from the confirmation email." });
  b.number = number;
  if (!str(b.practice) || !isEmail(str(b.email, 120))) return send(res, 400, { ok: false, error: "Please add your practice name and a valid email." });
  if (!(Array.isArray(b.challenges) && b.challenges.some((x) => str(x)))) return send(res, 400, { ok: false, error: "Please add at least one challenge." });

  try {
    const match = await findPracticeByNumber(number);
    if (!match) return send(res, 404, { ok: false, error: `We couldn't find registration #${number}. Check the number in your confirmation email, or write to us.` });
    const fields = prepareFields(b);
    fields["fldr2cS8IAIZ4NYlr"] = number;
    await createRecord(TABLES.prework, fields);
    return send(res, 200, { ok: true });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
