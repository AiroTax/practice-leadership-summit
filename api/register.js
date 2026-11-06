// POST /api/register — saves a practice registration, then emails the confirmation and a team notice.
import { readBody, str, isEmail, rateLimited, send } from "./_lib/airtable.js";
import { createPractice } from "./_lib/store.js";
import { sendConfirmation, sendTeamNotice } from "./_lib/notify.js";

const TYPES = ["Startup (under 5 years)", "Established, one location", "Multi-site"];
const TICKETS = ["Team of 3", "Team of 2", "Single seat", "Team of 4 or more"];
const ROLES = ["Office manager", "Associate dentist", "Hygienist", "Dental assistant", "Treatment coordinator", "Front desk", "Other"];
const HOTEL = ["No room needed", "Friday night", "Saturday night", "Friday and Saturday"];
const HEARD = ["Kasper", "Global Academy of Dentistry", "Another practice (referral)", "Greater New York Dental Meeting", "Other"];

export default async function handler(req, res) {
  try { return await handle(req, res); }
  catch (e) { console.error("Unexpected error", e); return send(res, 500, { ok: false, error: "Something went wrong on our side. Please try again in a minute." }); }
}

async function handle(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use POST." });
  const b = readBody(req);
  if (str(b.hp)) return send(res, 200, { ok: true, number: 0, reference: "" }); // honeypot: quietly ignore bots
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

  const site = str(b.website, 200), invoiceEmail = str(b.invoiceEmail, 120);
  const practiceRec = {
    name: practice, town, type, ticket, kasper: b.kasper === true,
    website: site ? (/^https?:\/\//i.test(site) ? site : "https://" + site) : "",
    extra: ticket === "Team of 4 or more" ? Math.max(1, Math.min(6, parseInt(b.extra, 10) || 1)) : 0,
    owner: { name: ownerName, email: ownerEmail, phone: str(b.ownerPhone, 40) },
    invoiceEmail: isEmail(invoiceEmail) ? invoiceEmail : "",
    members: (Array.isArray(b.members) ? b.members : []).slice(0, 3).map((m) => ({
      name: str(m && m.name, 100), role: ROLES.includes(m && m.role) ? m.role : "Other", email: isEmail(str(m && m.email, 120)) ? str(m.email, 120) : "",
    })).filter((m) => m.name),
    heard: HEARD.includes(b.heard) ? b.heard : "Other", referredBy: str(b.referredBy, 120),
    diet: str(b.diet), access: str(b.access), hotel: HOTEL.includes(b.hotel) ? b.hotel : "",
    consents: { photo: b.photo === true, kasper: b.kasperUpdates === true, gad: b.gadUpdates === true, intros: b.partnerIntros === true },
  };

  try {
    const p = await createPractice(practiceRec);
    // Emails never block the registration itself.
    await Promise.allSettled([sendConfirmation(p), sendTeamNotice(p)]).then((rs) => rs.forEach((r) => {
      if (r.status === "rejected") console.error("Registration email failed", r.reason);
    }));
    return send(res, 200, { ok: true, number: p.number, reference: p.reference || "", price: p.price ?? null });
  } catch (e) {
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong. Please try again." });
  }
}
