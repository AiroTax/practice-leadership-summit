// POST /api/prework — saves a practice's pre-work, matched by registration number.
// Which answers are accepted comes from ./_lib/questions.js; where they're saved, from ./_lib/store.js.
import { readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";
import { findPracticeByNumber, savePrework, updatePractice } from "./_lib/store.js";
import { reviewsFor, reviewsReady } from "./_lib/reviews.js";
import { sendPreworkThanks } from "./_lib/notify.js";
import { PREWORK, allQuestions } from "./_lib/questions.js";

const QUESTIONS = allQuestions(PREWORK);

function num(v, min, max) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

// Cleans the submitted answers against the question list, keyed by question key. Values take
// the same shape everywhere they are stored: numbers, choices, arrays for multi-picks, the
// payer mix as parts plus a one-line summary, and the three challenges as a numbered list.
export function cleanAnswers(b) {
  const a = {};
  for (const q of QUESTIONS) {
    const v = b[q.k];
    switch (q.type) {
      case "text": case "email": case "textarea": case "url": {
        const s = str(v, q.max || 300); if (s) a[q.k] = s; break;
      }
      case "number": case "slider": {
        const n = num(v, q.min ?? 0, q.max ?? 1e6); if (n !== undefined) a[q.k] = n; break;
      }
      case "choice": case "select": {
        if (q.opts.includes(v)) a[q.k] = v; break;
      }
      case "multi": {
        const picked = (Array.isArray(v) ? v : []).filter((x) => q.opts.includes(x));
        const list = [...new Set(picked)].slice(0, q.pick || q.opts.length);
        if (list.length) a[q.k] = list; break;
      }
      case "pct3": {
        const parts = [];
        for (const p of q.parts) {
          const n = num(b[p.k], 0, 100);
          if (n !== undefined) { a[p.k] = Math.round(n); parts.push(`${p.label} ${Math.round(n)}%`); }
        }
        if (parts.length) a[q.k] = parts.join(" · ");
        break;
      }
      case "scores": {
        for (const p of q.parts) { const n = num(b[p.k], 1, 5); if (n !== undefined) a[p.k] = Math.round(n); }
        break;
      }
      case "list3": {
        const items = (Array.isArray(v) ? v : []).map((x) => str(x, q.max || 200)).filter(Boolean).slice(0, 3);
        if (items.length) a[q.k] = items.map((x, i) => `${i + 1}. ${x}`).join("\n");
        break;
      }
    }
  }
  return a;
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
  // Everything except the registration number is optional; a mistyped email is simply left out.
  if (b.email && !isEmail(str(b.email, 120))) b.email = "";

  try {
    const match = await findPracticeByNumber(number);
    if (!match) return send(res, 404, { ok: false, error: `We couldn't find registration #${number}. Check the number in your confirmation email, or write to us.` });
    const answers = cleanAnswers(b);
    answers.number = number;
    await savePrework(number, answers);
    await sendPreworkThanks(match, answers).catch((e) => console.error("Pre-work email failed", e));
    // Start the facilitator's note from what patients praise on Google; the team edits it before release.
    if (reviewsReady() && !match.reportNote) {
      await reviewsFor(match).then((r) => r.found && r.draft ? updatePractice(match.id, { reportNote: r.draft }, match) : null)
        .catch((e) => console.error("Google reviews draft failed", e.message));
    }
    return send(res, 200, { ok: true });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
