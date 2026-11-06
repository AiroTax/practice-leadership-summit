// The emails the system sends on its own: confirmation, team notice, pre-work thanks,
// the report link, sign-in links, and the scheduled journey.
import { sendEmail, layout, markup, facts, button, esc, INBOX, SITE } from "./email.js";
import { JOURNEY, renderJourney, inAudience, isDue, firstName } from "./journey.js";
import { getJourneyState, logEmail, emailLog, listPractices, listPrework } from "./store.js";

const TEAM = () => (process.env.TEAM_EMAILS || INBOX).split(",").map((s) => s.trim()).filter(Boolean);
const money = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");
const def = (id) => JOURNEY.find((d) => d.id === id);

export async function journeyState() {
  const rows = await getJourneyState(), byId = {};
  rows.forEach((r) => { byId[r.id] = r; });
  const shared = (byId.vars && byId.vars.vars) || {};
  JOURNEY.forEach((d) => { byId[d.id] = { ...(byId[d.id] || {}), vars: shared }; });
  return byId;
}
export function recipients(p, withTeam) {
  const to = [p.owner.email].filter(Boolean);
  const cc = withTeam ? [...new Set(p.members.map((m) => m.email).filter((e) => e && e !== p.owner.email))] : [];
  return { to, cc };
}

async function deliver(id, p, msg, to, cc) {
  const r = await sendEmail({ to, cc, subject: msg.subject, html: msg.html, text: msg.text, tag: id });
  await logEmail({ practice_id: p && /^[0-9a-f-]{36}$/.test(p.id) ? p.id : null, email_id: id, to_addr: [].concat(to, cc || []).join(", "),
    subject: msg.subject, status: r.ok ? (r.local ? "preview" : "sent") : "failed", provider_id: r.id || null, error: r.ok ? null : r.error });
  return r;
}

// e01, sent the moment a practice registers.
export async function sendConfirmation(p) {
  const st = (await journeyState().catch(() => ({})))["e01"] || {};
  const msg = renderJourney(def("e01"), p, null, st);
  const { to, cc } = recipients(p, true);
  return deliver("e01", p, msg, to, cc);
}

// A short notice to the team inbox for every registration.
export async function sendTeamNotice(p) {
  const m = buildTeamNotice(p);
  return deliver("team-notice", p, m, TEAM(), []);
}
export function buildTeamNotice(p) {
  const rows = [
    ["Practice", `${p.name}, ${p.town}`], ["Reference", `${p.reference} (table ${p.number})`], ["Ticket", `${p.ticket} · ${p.people} people · ${money(p.price)}`],
    ["Owner", `${p.owner.name} · ${p.owner.email}${p.owner.phone ? " · " + p.owner.phone : ""}`],
    ["Team", p.members.map((m) => `${m.name} (${m.role})`).join(", ") || "Names to follow"],
    ["Invoice to", p.invoiceEmail || p.owner.email], ["Kasper customer", p.kasper ? "Yes" : "No"], ["Heard via", p.heard + (p.referredBy ? ` (${p.referredBy})` : "")],
  ];
  if (p.hotel && p.hotel !== "No room needed") rows.push(["Hotel", p.hotel]);
  if (p.diet) rows.push(["Dietary", p.diet]);
  if (p.access) rows.push(["Accessibility", p.access]);
  const body = `<p style="margin:0 0 16px;font:16px/1.6 'Atkinson Hyperlegible',Arial,sans-serif;color:#3A4560">A new practice just claimed a table. The invoice is due within two business days.</p>${facts(rows)}${button("Open the console", SITE + "/admin#practices")}`;
  const html = layout({ title: `New table: ${p.name}`, eyebrow: "New registration", preheader: `${p.ticket}, ${money(p.price)}`, body });
  return { subject: `New registration: ${p.name} (${p.reference})`, html, text: rows.map((r) => r.join(": ")).join("\n") };
}

// Thanks for the pre-work, to whoever sent it and the owner.
export async function sendPreworkThanks(p, answers) {
  const to = [answers.email, p.owner.email].filter((e, i, a) => e && a.indexOf(e) === i);
  return deliver("prework-thanks", p, buildPreworkThanks(p, answers), to, []);
}
export function buildPreworkThanks(p, answers) {
  const body = markup(`Hi ${answers.answeredBy === "Owner" || !answers.email ? firstName(p.owner.name) : "there"},

Thank you. We have the pre-work for **${p.name}**, and it’s the starting point for your Practice Snapshot.

1. We read your answers and set them against published benchmarks for US dental practices.
2. Your Snapshot arrives by email in mid-December, with a private link.
3. We book your 20-minute welcome call${answers.callTime ? ` (you asked for ${answers.callTime.toLowerCase()})` : ""} to walk through it with your team.

Need to change an answer? Reply to this email and tell us what to update.

The Kasper summit team, in partnership with Global Academy of Dentistry`);
  const html = layout({ title: "Your pre-work is in", eyebrow: "Pre-work received", preheader: "Your Practice Snapshot is next.", body });
  return { subject: `Pre-work received for ${p.name}`, html, text: "Thank you, we have your pre-work." };
}

// e04, the report link. Sent from the console.
export async function sendReport(p, pw) {
  const st = (await journeyState())["e04"] || {};
  const msg = renderJourney(def("e04"), p, pw, st);
  if (msg.missing.length) throw Object.assign(new Error("Missing " + msg.missing.join(", ")), { status: 400 });
  const cc = pw && pw.email && pw.email !== p.owner.email ? [pw.email] : [];
  return deliver("e04", p, msg, [p.owner.email], cc);
}

export async function sendSignIn(email, link) {
  const m = buildSignIn(link);
  return sendEmail({ to: email, subject: m.subject, html: m.html, text: m.text, tag: "signin" });
}
export function buildSignIn(link) {
  const body = markup(`Use this button to sign in to the Summit Console. It expires in 15 minutes.

[[Sign in to the console|${link}]]

If you didn’t ask to sign in, you can ignore this email.`);
  const html = layout({ title: "Sign in to the Summit Console", eyebrow: "Team sign-in", preheader: "Your sign-in link, valid for 15 minutes.", body });
  return { subject: "Your Summit Console sign-in link", html, text: "Sign in: " + link };
}

// Runs every morning (Vercel Cron). Sends approved, dated emails that are due and not yet sent.
export async function runJourney({ now = Date.now(), dry = false } = {}) {
  const st = await journeyState(), practices = await listPractices(), pre = await listPrework();
  const sent = new Set((await emailLog(5000)).filter((l) => l.status === "sent").map((l) => l.practice_id + "|" + l.email_id));
  const out = [];
  for (const d of JOURNEY) {
    const s = st[d.id] || {};
    if (s.status !== "approved" || !["date", "after"].includes(d.schedule.type)) continue;
    for (const p of practices) {
      if (!isDue(d, p, now) || !inAudience(d.audience, p, pre[p.number]) || sent.has(p.id + "|" + d.id)) continue;
      const msg = renderJourney(d, p, pre[p.number], s);
      if (msg.missing.length) { out.push({ id: d.id, practice: p.name, skipped: "missing " + msg.missing.join(", ") }); continue; }
      if (dry) { out.push({ id: d.id, practice: p.name, would: true }); continue; }
      const { to, cc } = recipients(p, !!d.cc);
      const r = await deliver(d.id, p, msg, to, cc);
      out.push({ id: d.id, practice: p.name, ok: r.ok, error: r.error });
    }
  }
  return out;
}

// e07 and any other "send to everyone in the audience now" email.
export async function broadcast(id) {
  const d = def(id), st = (await journeyState())[id] || {};
  if (!d) throw Object.assign(new Error("Unknown email"), { status: 404 });
  const practices = await listPractices(), pre = await listPrework(), out = [];
  for (const p of practices) {
    if (!inAudience(d.audience, p, pre[p.number])) continue;
    const msg = renderJourney(d, p, pre[p.number], st);
    if (msg.missing.length) throw Object.assign(new Error("Fill in " + msg.missing.join(", ") + " first."), { status: 400 });
    const { to, cc } = recipients(p, !!d.cc);
    const r = await deliver(id, p, msg, to, cc); out.push({ practice: p.name, ok: r.ok });
  }
  return out;
}
export { esc };
