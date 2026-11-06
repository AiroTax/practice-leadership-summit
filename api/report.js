// GET /api/report?k=<key> — the data behind an office's Practice Snapshot.
// Works only when the team has marked the report Ready or Sent in the console; the key is the
// private part of the link sent to the office. Emails and phone numbers are never returned.
import { P, TABLES, findRecords, send } from "./_lib/airtable.js";
import { PREWORK, allQuestions } from "./_lib/questions.js";

const R = { key: "fldHXMD642fUXDoya", status: "fldJhKCLaajLBiysV", note: "fld3oNCdVjnIKLtr3", count: "fldc8mdPGD4irI74P" };
const PW_NUM = "fldr2cS8IAIZ4NYlr", PW_AT = "fldrMMIHs9UklprSM";
const QUESTIONS = allQuestions(PREWORK);
const name = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v.name : v);
const val = (v) => (Array.isArray(v) ? v.map(name) : name(v));

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return send(res, 405, { ok: false, error: "Use GET." });
    const k = String((req.query && req.query.k) || new URL(req.url, "http://x").searchParams.get("k") || "");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) return send(res, 404, { ok: false, error: "This report link isn’t valid. Check the link in your email." });
    const found = await findRecords(TABLES.practices, `AND({Report key}='${k}', OR({Report status}='Ready', {Report status}='Sent'))`);
    if (!found.length) return send(res, 404, { ok: false, error: "This report isn’t available. It may not be ready yet, or the link has changed." });
    const c = found[0].fields || {};
    const people = [];
    if (c[P.ownerName]) people.push({ name: c[P.ownerName], role: "Owner" });
    P.members.forEach((m) => { if (c[m.name]) people.push({ name: c[m.name], role: name(c[m.role]) || "" }); });
    const pw = (await findRecords(TABLES.prework, `{Registration #}=${Number(c[P.number]) || 0}`, 1))[0];
    const answers = {};
    if (pw) {
      const f = pw.fields || {};
      for (const q of QUESTIONS) {
        if (["number", "email", "practice"].includes(q.k)) continue;
        if (q.parts) q.parts.forEach((p) => { if (f[p.f] != null) answers[p.k] = val(f[p.f]); });
        else if (q.f && f[q.f] != null) answers[q.k] = val(f[q.f]);
      }
    }
    res.setHeader("X-Robots-Tag", "noindex");
    return send(res, 200, {
      ok: true,
      report: {
        practice: { name: c[P.name] || "", town: c[P.town] || "", type: name(c[P.type]) || "", ticket: name(c[P.ticket]) || "", count: c[R.count] || people.length, people, website: c[P.website] || "" },
        answers, hasPrework: !!pw, note: c[R.note] || "", preparedOn: (pw && pw.fields && pw.fields[PW_AT]) || new Date().toISOString(),
      },
    });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
