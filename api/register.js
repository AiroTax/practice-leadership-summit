// POST /api/register — saves a practice registration to Airtable.
import { P, TABLES, createRecord, getRecord, readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";

const TYPES = ["Startup (under 5 years)", "Established, one location", "Multi-site"];
const TICKETS = ["Team of 3", "Team of 2", "Single seat", "Team of 4 or more"];
const ROLES = ["Office manager", "Associate dentist", "Hygienist", "Dental assistant", "Treatment coordinator", "Front desk", "Other"];
const HEARD = ["Kasper", "Global Academy of Dentistry", "Another practice (referral)", "Greater New York Dental Meeting", "Other"];

export default async function handler(req, res) {
  try { return await handle(req, res); }
  catch (e) { console.error("Unexpected error", e); return send(res, 500, { ok: false, error: "Something went wrong on our side. Please try again in a minute." }); }
}

async function handle(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
  const b = readBody(req);
  if (str(b.website)) return send(res, 200, { ok: true, number: 0, reference: "" }); // honeypot: quietly ignore bots
  if (rateLimited(req)) return send(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes and try again." });

  const practice = str(b.practice, 120), town = str(b.town, 80), ownerName = str(b.ownerName, 100), ownerEmail = str(b.ownerEmail, 120);
  const type = TYPES.includes(b.type) ? b.type : "", ticket = TICKETS.includes(b.ticket) ? b.ticket : "";
  const missing = [];
  if (!practice) missing.push("practice name");
  if (!town) missing.push("town");
  if (!type) missing.push("practice type");
  if (!ticket) missing.push("ticket");
  if (!ownerName) missing.push("owner’s name");
  if (!isEmail(ownerEmail)) missing.push("a valid owner email");
  if (b.terms !== true) missing.push("acceptance of the terms");
  if (missing.length) return send(res, 400, { ok: false, error: "Please add " + missing.join(", ") + "." });

  const fields = {
    [P.name]: practice, [P.town]: town, [P.type]: type, [P.ticket]: ticket, [P.kasper]: b.kasper === true,
    [P.ownerName]: ownerName, [P.ownerEmail]: ownerEmail, [P.ownerPhone]: str(b.ownerPhone, 40),
    [P.heard]: HEARD.includes(b.heard) ? b.heard : "Other", [P.referredBy]: str(b.referredBy, 120),
    [P.diet]: str(b.diet), [P.access]: str(b.access),
    [P.photo]: b.photo === true, [P.kasperUpdates]: b.kasperUpdates === true, [P.gadUpdates]: b.gadUpdates === true,
    [P.partnerIntros]: b.partnerIntros === true, [P.terms]: true,
  };
  if (ticket === "Team of 4 or more") fields[P.extra] = Math.max(1, Math.min(6, parseInt(b.extra, 10) || 1));
  (Array.isArray(b.members) ? b.members : []).slice(0, 3).forEach((m, i) => {
    const name = str(m && m.name, 100);
    if (!name) return;
    fields[P.members[i].name] = name;
    fields[P.members[i].role] = ROLES.includes(m.role) ? m.role : "Other";
    const email = str(m.email, 120);
    if (isEmail(email)) fields[P.members[i].email] = email;
  });
  // Don't send empty strings for optional fields.
  Object.keys(fields).forEach((k) => { if (fields[k] === "") delete fields[k]; });

  try {
    let rec = await createRecord(TABLES.practices, fields);
    let f = rec.fields || {};
    if (f[P.number] == null) { rec = await getRecord(TABLES.practices, rec.id); f = rec.fields || {}; }
    return send(res, 200, { ok: true, number: f[P.number], reference: f[P.reference] || "", price: f[P.price] ?? null });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
