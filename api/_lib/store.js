// Where the summit's data lives. Every handler talks to this file, never to a database directly.
//
//   SUPABASE_URL + SUPABASE_SERVICE_KEY set  -> Supabase (Postgres)
//   otherwise AIRTABLE_TOKEN set             -> the Airtable base (the original setup)
//   STORE_MOCK=1 or AIRTABLE_MOCK=1          -> in-memory, for local testing
//
// Records come back in one plain shape whichever backend is used:
//   practice: { id, number, reference, createdAt, name, town, website, type, ticket, extra, people, price,
//     kasper, owner:{name,email,phone}, invoiceEmail, members:[{name,role,email}], heard, referredBy, diet,
//     access, hotel, consents:{photo,kasper,gad,intros}, invoice, call, windso, day30, notes,
//     checkedIn:[owner,m1,m2,m3], reportKey, reportStatus, reportNote, reportSentAt }
//   prework:  { number, createdAt, email, answeredBy, answers:{<question key>: value} }

import { P, TABLES, airtable } from "./airtable.js";
import { PREWORK, allQuestions } from "./questions.js";
import { priceFor, peopleFor } from "./pricing.js";

const QUESTIONS = allQuestions(PREWORK);

export function backend() {
  if (process.env.STORE_MOCK === "1" || process.env.AIRTABLE_MOCK === "1") return "mock";
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) return "supabase";
  return "airtable";
}
const err = (msg, status = 502) => Object.assign(new Error(msg), { status });
const SAVE_FAIL = "We couldn't save that just now. Please try again in a minute.";

// Fields the team console may change, and their allowed values.
export const EDITABLE = {
  invoice: ["To send", "Sent", "Paid"], call: ["Not booked", "Booked", "Done"], windso: ["None", "Eligible", "Offered", "Claimed"],
  reportStatus: ["Draft", "Ready", "Sent"], day30: "bool", notes: "text", reportNote: "text", checkedIn: "bools",
};

export function newKey() {
  const b = new Uint8Array(18); crypto.getRandomValues(b);
  return Buffer.from(b).toString("base64url");
}

/* ======================================================================================
   Supabase (PostgREST over fetch, service key, server side only)
   ====================================================================================== */
async function sb(path, init = {}) {
  const url = process.env.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" + path;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const res = await fetch(url, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) { console.error("Supabase error", res.status, text); throw err(SAVE_FAIL); }
  return json;
}
const enc = encodeURIComponent;

function fromRow(r) {
  if (!r) return null;
  return {
    id: r.id, number: r.number, reference: r.reference, createdAt: r.created_at, name: r.name || "", town: r.town || "",
    website: r.website || "", type: r.type || "", ticket: r.ticket || "", extra: r.extra || 0,
    people: r.people || peopleFor(r.ticket, r.extra), price: r.price || 0, kasper: !!r.kasper,
    owner: { name: r.owner_name || "", email: r.owner_email || "", phone: r.owner_phone || "" },
    invoiceEmail: r.invoice_email || "", members: Array.isArray(r.members) ? r.members : [],
    heard: r.heard || "", referredBy: r.referred_by || "", diet: r.diet || "", access: r.access || "", hotel: r.hotel || "",
    consents: { photo: !!r.consent_photo, kasper: !!r.consent_kasper, gad: !!r.consent_gad, intros: !!r.consent_intros },
    invoice: r.invoice || "To send", call: r.call || "Not booked", windso: r.windso || "None", day30: !!r.day30, notes: r.notes || "",
    checkedIn: Array.isArray(r.checked_in) ? r.checked_in : [false, false, false, false],
    reportKey: r.report_key || "", reportStatus: r.report_status || "Draft", reportNote: r.report_note || "", reportSentAt: r.report_sent_at || "",
  };
}
function toRow(p) {
  return {
    name: p.name, town: p.town || null, website: p.website || null, type: p.type || null, ticket: p.ticket || null,
    extra: p.extra || null, people: p.people, price: p.price, kasper: !!p.kasper,
    owner_name: p.owner.name, owner_email: p.owner.email, owner_phone: p.owner.phone || null, invoice_email: p.invoiceEmail || null,
    members: p.members || [], heard: p.heard || null, referred_by: p.referredBy || null, diet: p.diet || null, access: p.access || null,
    hotel: p.hotel || null, consent_photo: !!p.consents.photo, consent_kasper: !!p.consents.kasper, consent_gad: !!p.consents.gad,
    consent_intros: !!p.consents.intros, terms_at: new Date().toISOString(), windso: p.ticket === "Team of 3" || p.ticket === "Team of 4 or more" ? "Eligible" : "None",
  };
}
const PATCH_COL = { invoice: "invoice", call: "call", windso: "windso", day30: "day30", notes: "notes", reportNote: "report_note",
  reportStatus: "report_status", reportKey: "report_key", checkedIn: "checked_in", reportSentAt: "report_sent_at" };
const pwFromRow = (r) => r && ({ number: r.number, createdAt: r.created_at, email: r.email || "", answeredBy: r.answered_by || "", answers: r.answers || {} });

const SUPA = {
  async createPractice(p) { const [r] = await sb("practices", { method: "POST", body: JSON.stringify(toRow(p)) }); return fromRow(r); },
  async getPractice(id) { const [r] = await sb(`practices?id=eq.${enc(id)}&limit=1`); return fromRow(r); },
  async findPracticeByNumber(n) { const [r] = await sb(`practices?number=eq.${Number(n) || 0}&limit=1`); return fromRow(r); },
  async findPracticeByReportKey(k) { const [r] = await sb(`practices?report_key=eq.${enc(k)}&limit=1`); return fromRow(r); },
  async listPractices() { return (await sb("practices?order=created_at.desc&limit=1000")).map(fromRow); },
  async countPractices() {
    const res = await fetch(process.env.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/practices?select=id", {
      method: "HEAD", headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, Prefer: "count=exact" } });
    return Number((res.headers.get("content-range") || "*/0").split("/")[1]) || 0;
  },
  async updatePractice(id, patch) {
    const row = { updated_at: new Date().toISOString() };
    for (const k of Object.keys(patch)) if (PATCH_COL[k]) row[PATCH_COL[k]] = patch[k];
    const [r] = await sb(`practices?id=eq.${enc(id)}`, { method: "PATCH", body: JSON.stringify(row) });
    return fromRow(r);
  },
  async savePrework(number, a) {
    await sb("prework", { method: "POST", body: JSON.stringify({ number, email: a.email || null, answered_by: a.answeredBy || null, answers: a }) });
  },
  async getPrework(number) { const [r] = await sb(`prework?number=eq.${Number(number) || 0}&order=created_at.desc&limit=1`); return pwFromRow(r); },
  async listPrework() {
    const rows = await sb("prework?order=created_at.desc&limit=2000"), out = {};
    rows.forEach((r) => { if (!out[r.number]) out[r.number] = pwFromRow(r); });
    return out;
  },
  async getJourney() { return sb("journey?select=*"); },
  async saveJourney(id, patch) {
    const [r] = await sb("journey?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ id, ...patch, updated_at: new Date().toISOString() }) });
    return r;
  },
  async logEmail(e) {
    try { await sb("email_log", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(e) }); }
    catch (x) { console.error("email_log insert failed", x.message); }
  },
  async emailLog(limit = 300) { return sb(`email_log?order=created_at.desc&limit=${limit}`); },
};

/* ======================================================================================
   Airtable (fields by ID). Journey and email log live in Supabase only; on Airtable the
   journey approvals are kept in memory and the log is the function logs.
   ====================================================================================== */
const AF = {
  ci: ["fld5K666XMNT338VY", "fldYS99VGOWjfBcZH", "fld381noXtb44GDbq", "fldaC8nJiCaj43wNy"],
  invoice: "fldyFvrT5y4Sd0Qil", call: "fldsDYHwukoZppn68", windso: "fldjpyYnaOULKSDCS", day30: "fldPB4CKGbXi3rb60", notes: "flddneOzgffcCigSK",
  created: "fldWQ3r7cjBu2BXN8", people: "fldc8mdPGD4irI74P",
  reportKey: "fldHXMD642fUXDoya", reportStatus: "fldJhKCLaajLBiysV", reportNote: "fld3oNCdVjnIKLtr3",
};
const PW_NUM = "fldr2cS8IAIZ4NYlr", PW_AT = "fldrMMIHs9UklprSM";
const sv = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v.name : v);
const svs = (v) => (Array.isArray(v) ? v.map(sv) : sv(v));

function fromAt(rec) {
  if (!rec) return null;
  const c = rec.fields || rec.cellValuesByFieldId || {};
  const members = P.members.map((m) => ({ name: c[m.name] || "", role: sv(c[m.role]) || "", email: c[m.email] || "" })).filter((m) => m.name);
  return {
    id: rec.id, number: c[P.number], reference: c[P.reference] || "", createdAt: c[AF.created] || rec.createdTime || "",
    name: c[P.name] || "", town: c[P.town] || "", website: c[P.website] || "", type: sv(c[P.type]) || "", ticket: sv(c[P.ticket]) || "",
    extra: c[P.extra] || 0, people: c[AF.people] || peopleFor(sv(c[P.ticket]), c[P.extra]), price: +c[P.price] || 0, kasper: !!c[P.kasper],
    owner: { name: c[P.ownerName] || "", email: c[P.ownerEmail] || "", phone: c[P.ownerPhone] || "" }, invoiceEmail: c[P.invoiceEmail] || "",
    members, heard: sv(c[P.heard]) || "", referredBy: c[P.referredBy] || "", diet: c[P.diet] || "", access: c[P.access] || "", hotel: sv(c[P.hotel]) || "",
    consents: { photo: !!c[P.photo], kasper: !!c[P.kasperUpdates], gad: !!c[P.gadUpdates], intros: !!c[P.partnerIntros] },
    invoice: sv(c[AF.invoice]) || "To send", call: sv(c[AF.call]) || "Not booked", windso: sv(c[AF.windso]) || "None", day30: !!c[AF.day30],
    notes: c[AF.notes] || "", checkedIn: AF.ci.map((f) => !!c[f]),
    reportKey: c[AF.reportKey] || "", reportStatus: sv(c[AF.reportStatus]) || "Draft", reportNote: c[AF.reportNote] || "", reportSentAt: "",
  };
}
function toAt(p) {
  const f = {
    [P.name]: p.name, [P.town]: p.town, [P.type]: p.type, [P.ticket]: p.ticket, [P.kasper]: !!p.kasper,
    [P.ownerName]: p.owner.name, [P.ownerEmail]: p.owner.email, [P.ownerPhone]: p.owner.phone, [P.heard]: p.heard, [P.referredBy]: p.referredBy,
    [P.diet]: p.diet, [P.access]: p.access, [P.photo]: !!p.consents.photo, [P.kasperUpdates]: !!p.consents.kasper, [P.gadUpdates]: !!p.consents.gad,
    [P.partnerIntros]: !!p.consents.intros, [P.terms]: true, [P.hotel]: p.hotel, [P.website]: p.website, [P.invoiceEmail]: p.invoiceEmail,
  };
  if (p.ticket === "Team of 4 or more") f[P.extra] = p.extra;
  (p.members || []).slice(0, 3).forEach((m, i) => { f[P.members[i].name] = m.name; f[P.members[i].role] = m.role; if (m.email) f[P.members[i].email] = m.email; });
  Object.keys(f).forEach((k) => { if (f[k] === "" || f[k] == null) delete f[k]; });
  return f;
}
function answersFromAt(c) {
  const a = {};
  for (const q of QUESTIONS) {
    if (q.parts) q.parts.forEach((p) => { if (c[p.f] != null) a[p.k] = svs(c[p.f]); });
    const f = q.type === "pct3" ? q.summary : q.f;
    if (f && c[f] != null) a[q.k] = svs(c[f]);
  }
  return { number: c[PW_NUM], createdAt: c[PW_AT] || "", email: a.email || "", answeredBy: a.answeredBy || "", answers: a };
}
function answersToAt(a) {
  const f = {};
  for (const q of QUESTIONS) {
    if (q.parts) q.parts.forEach((p) => { if (a[p.k] != null) f[p.f] = a[p.k]; });
    const fid = q.type === "pct3" ? q.summary : q.f;
    if (fid && a[q.k] != null) f[fid] = a[q.k];
  }
  return f;
}
async function atAll(table) {
  const out = []; let offset;
  do {
    const q = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) q.set("offset", offset);
    const j = await airtable(`${table}?${q}`); out.push(...(j.records || [])); offset = j.offset;
  } while (offset);
  return out;
}
async function atFind(table, formula, max = 1) {
  const q = new URLSearchParams({ filterByFormula: formula, maxRecords: String(max), returnFieldsByFieldId: "true" });
  return (await airtable(`${table}?${q}`)).records || [];
}
const memJourney = globalThis.__summitJourney || (globalThis.__summitJourney = {});

const AT = {
  async createPractice(p) {
    const out = await airtable(TABLES.practices, { method: "POST", body: JSON.stringify({ records: [{ fields: toAt(p) }], typecast: true, returnFieldsByFieldId: true }) });
    let rec = out.records[0];
    if ((rec.fields || {})[P.number] == null) rec = await airtable(`${TABLES.practices}/${rec.id}?returnFieldsByFieldId=true`);
    return fromAt(rec);
  },
  async getPractice(id) { return fromAt(await airtable(`${TABLES.practices}/${id}?returnFieldsByFieldId=true`)); },
  async findPracticeByNumber(n) { return fromAt((await atFind(TABLES.practices, `{Registration #}=${Number(n) || 0}`))[0]); },
  async findPracticeByReportKey(k) { return fromAt((await atFind(TABLES.practices, `{Report key}='${k}'`))[0]); },
  async listPractices() { return (await atAll(TABLES.practices)).map(fromAt).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); },
  async countPractices() { return (await atAll(TABLES.practices)).length; },
  async updatePractice(id, patch) {
    const f = {};
    for (const k of Object.keys(patch)) {
      if (k === "checkedIn") patch.checkedIn.forEach((v, i) => { f[AF.ci[i]] = !!v; });
      else if (AF[k]) f[AF[k]] = patch[k];
    }
    const out = await airtable(TABLES.practices, { method: "PATCH", body: JSON.stringify({ records: [{ id, fields: f }], typecast: true, returnFieldsByFieldId: true }) });
    return fromAt(out.records[0]);
  },
  async savePrework(number, a) {
    await airtable(TABLES.prework, { method: "POST", body: JSON.stringify({ records: [{ fields: { ...answersToAt(a), [PW_NUM]: number } }], typecast: true }) });
  },
  async getPrework(number) { const r = (await atFind(TABLES.prework, `{Registration #}=${Number(number) || 0}`))[0]; return r ? answersFromAt(r.fields) : null; },
  async listPrework() { const out = {}; (await atAll(TABLES.prework)).forEach((r) => { const pw = answersFromAt(r.fields); if (pw.number != null && !out[pw.number]) out[pw.number] = pw; }); return out; },
  async getJourney() { return Object.values(memJourney); },
  async saveJourney(id, patch) { memJourney[id] = { ...(memJourney[id] || { id }), ...patch, updated_at: new Date().toISOString() }; return memJourney[id]; },
  async logEmail(e) { console.log("email", JSON.stringify(e)); },
  async emailLog() { return []; },
};

/* ======================================================================================
   In-memory (local testing)
   ====================================================================================== */
const mem = globalThis.__summitStore || (globalThis.__summitStore = { practices: [], prework: [], journey: {}, log: [], n: 0 });
const MOCK = {
  async createPractice(p) {
    const n = ++mem.n;
    const rec = { ...p, id: "mock-" + n + "-" + Math.random().toString(36).slice(2, 8), number: n, reference: "PLS-" + String(n).padStart(3, "0"),
      createdAt: new Date().toISOString(), invoice: "To send", call: "Not booked", windso: p.ticket === "Team of 3" || p.ticket === "Team of 4 or more" ? "Eligible" : "None",
      day30: false, notes: "", checkedIn: [false, false, false, false], reportKey: "", reportStatus: "Draft", reportNote: "", reportSentAt: "" };
    mem.practices.unshift(rec); return structuredClone(rec);
  },
  async getPractice(id) { const r = mem.practices.find((x) => x.id === id); return r ? structuredClone(r) : null; },
  async findPracticeByNumber(n) { const r = mem.practices.find((x) => x.number === Number(n)); return r ? structuredClone(r) : null; },
  async findPracticeByReportKey(k) { const r = mem.practices.find((x) => x.reportKey === k); return r ? structuredClone(r) : null; },
  async listPractices() { return structuredClone(mem.practices); },
  async countPractices() { return mem.practices.length; },
  async updatePractice(id, patch) { const r = mem.practices.find((x) => x.id === id); if (!r) throw err("Not found", 404); Object.assign(r, patch); return structuredClone(r); },
  async savePrework(number, a) { mem.prework.unshift({ number, createdAt: new Date().toISOString(), email: a.email || "", answeredBy: a.answeredBy || "", answers: a }); },
  async getPrework(number) { const r = mem.prework.find((x) => x.number === Number(number)); return r ? structuredClone(r) : null; },
  async listPrework() { const out = {}; mem.prework.forEach((r) => { if (!out[r.number]) out[r.number] = structuredClone(r); }); return out; },
  async getJourney() { return Object.values(mem.journey); },
  async saveJourney(id, patch) { mem.journey[id] = { ...(mem.journey[id] || { id }), ...patch, updated_at: new Date().toISOString() }; return mem.journey[id]; },
  async logEmail(e) { mem.log.unshift({ ...e, id: mem.log.length + 1, created_at: new Date().toISOString() }); },
  async emailLog() { return mem.log.slice(0, 300); },
};

const impl = () => ({ supabase: SUPA, airtable: AT, mock: MOCK })[backend()];

/* ======================================================================================
   Public API
   ====================================================================================== */
// Takes a cleaned registration and saves it; price and head count are worked out here.
export async function createPractice(p) {
  p.people = peopleFor(p.ticket, p.extra);
  p.price = priceFor(p.ticket, p.extra, p.kasper);
  return impl().createPractice(p);
}
export const getPractice = (id) => impl().getPractice(id);
export const findPracticeByNumber = (n) => impl().findPracticeByNumber(n);
export const listPractices = () => impl().listPractices();
export const countPractices = () => impl().countPractices();
export const savePrework = (n, a) => impl().savePrework(n, a);
export const getPrework = (n) => impl().getPrework(n);
export const listPrework = () => impl().listPrework();
export const getJourneyState = () => impl().getJourney();
export const saveJourneyState = (id, patch) => impl().saveJourney(id, patch);
export const logEmail = (e) => impl().logEmail(e);
export const emailLog = (n) => impl().emailLog(n);

// Only the console's editable fields get through; a report key is created when a report is released.
export async function updatePractice(id, patch, current) {
  const clean = {};
  for (const [k, v] of Object.entries(patch || {})) {
    const rule = EDITABLE[k];
    if (Array.isArray(rule)) { if (rule.includes(v)) clean[k] = v; }
    else if (rule === "bool") clean[k] = !!v;
    else if (rule === "text") clean[k] = String(v ?? "").slice(0, 5000);
    else if (rule === "bools" && Array.isArray(v)) clean[k] = [0, 1, 2, 3].map((i) => !!v[i]);
  }
  if (clean.reportStatus && clean.reportStatus !== "Draft") {
    const cur = current || (await getPractice(id));
    if (cur && !cur.reportKey) clean.reportKey = newKey();
  }
  if (clean.reportStatus === "Sent") clean.reportSentAt = new Date().toISOString();
  if (!Object.keys(clean).length) throw err("Nothing to change.", 400);
  return impl().updatePractice(id, clean);
}

// The data behind an office's report page. Only Ready or Sent reports open; no emails or phones.
export async function reportByKey(k) {
  const p = await impl().findPracticeByReportKey(k);
  if (!p || !["Ready", "Sent"].includes(p.reportStatus)) return null;
  const pw = await getPrework(p.number);
  return reportData(p, pw);
}
export function reportData(p, pw) {
  const a = { ...((pw && pw.answers) || {}) };
  ["number", "email", "practice"].forEach((k) => delete a[k]);
  const people = [];
  if (p.owner.name) people.push({ name: p.owner.name, role: "Owner" });
  p.members.forEach((m) => people.push({ name: m.name, role: m.role || "" }));
  return {
    practice: { name: p.name, town: p.town, type: p.type, ticket: p.ticket, count: p.people || people.length, people, website: p.website },
    answers: a, hasPrework: !!pw, note: p.reportNote || "", preparedOn: (pw && pw.createdAt) || new Date().toISOString(),
  };
}
