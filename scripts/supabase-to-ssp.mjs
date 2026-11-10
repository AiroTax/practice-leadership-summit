// One-time copy of the summit's data from Supabase (the Vercel setup) into SSP.db, so the site on
// practice-leadership-summit.amalandco.com starts with every registration, pre-work, email
// approval and the email log (which stops anyone being emailed twice).
//
//   SUPABASE_URL=… SUPABASE_SERVICE_KEY=sb_secret_… SSP_SITE_API_KEY=ssp_site_… node scripts/supabase-to-ssp.mjs
//
//   SSP_SITE_DOMAIN  default practice-leadership-summit.amalandco.com
//   FORCE=1          copy even if SSP already holds practices (you'd get duplicates)
//   DRY_RUN=1        count what would be copied, write nothing
import fs from "node:fs";

process.env.STORE_BACKEND = "ssp";
process.env.SSP_SITE_DOMAIN ||= "practice-leadership-summit.amalandco.com";
process.env.SITE_URL ||= process.env.SSP_BASE_URL || "https://" + process.env.SSP_SITE_DOMAIN;
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SSP_SITE_API_KEY"]) if (!process.env[k]) { console.error("Set " + k); process.exit(1); }

const { db, kv } = await import("../api/_lib/ssp.js");
const { listPractices, listPrework, publishReport } = await import("../api/_lib/store.js");
const schema = JSON.parse(fs.readFileSync(new URL("../ssp.json", import.meta.url), "utf8")).collections;
const dry = process.env.DRY_RUN === "1";
const pause = () => new Promise((r) => setTimeout(r, 600)); // the site API key allows 120 calls a minute

async function supa(table) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  const order = table === "journey" ? "" : "&order=created_at.asc";
  const res = await fetch(process.env.SUPABASE_URL.replace(/\/+$/, "") + `/rest/v1/${table}?select=*${order}&limit=10000`, {
    headers: key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: "Bearer " + key },
  });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}
// Keep only fields ssp.json declares, and drop empty values (the schema treats null as "not given").
const fit = (c, row) => {
  const out = {};
  for (const f of Object.keys(schema[c].fields)) if (row[f] !== null && row[f] !== undefined && row[f] !== "") out[f] = row[f];
  return out;
};

const existing = await db.list("practices");
if (existing.length && process.env.FORCE !== "1") { console.error(`SSP already has ${existing.length} practices. Nothing copied (FORCE=1 to copy anyway).`); process.exit(1); }

const [practices, prework, journey, log] = await Promise.all(["practices", "prework", "journey", "email_log"].map(supa));
console.log(`Supabase: ${practices.length} practices, ${prework.length} pre-work, ${journey.length} email settings, ${log.length} log rows`);
if (dry) process.exit(0);

const member = (m) => { const o = {}; ["name", "role", "email"].forEach((k) => { if (m && m[k]) o[k] = m[k]; }); return o; };
const idMap = {};
for (const r of practices) {
  const rec = await db.create("practices", fit("practices", { ...r, members: (r.members || []).map(member) }));
  idMap[r.id] = rec.id; await pause();
}
for (const r of prework) { await db.create("prework", fit("prework", r)); await pause(); }
for (const r of journey) { await db.create("journey", fit("journey", { ...r, key: r.id })); await pause(); }
for (const r of log) {
  await db.create("email_log", fit("email_log", { ...r, practice_id: r.practice_id ? idMap[r.practice_id] || null : null, provider_id: r.provider_id ? String(r.provider_id) : null }));
  await pause();
}

// The instant emails were handled on Vercel; note them so the sweep doesn't send them again.
const logged = new Set(log.filter((l) => l.status === "sent").map((l) => l.practice_id + "|" + l.email_id));
const hasPw = new Set(prework.map((r) => r.number));
for (const r of practices) {
  for (const id of ["e01", "team-notice"].concat(hasPw.has(r.number) ? ["prework-thanks"] : [])) {
    if (logged.has(r.id + "|" + id)) continue;
    await db.create("email_log", { practice_id: idMap[r.id], email_id: id, status: "sent", subject: "(handled before the move to SSP)", created_at: new Date().toISOString() });
    await pause();
  }
}

// Released reports get their private copy for the office's link, and the website its table count.
const all = await listPractices(), pre = await listPrework();
for (const p of all) if (p.reportKey && ["Ready", "Sent"].includes(p.reportStatus)) { await publishReport(p, pre[p.number]); await pause(); }
await kv.set("stats", { claimed: all.length, total: 35, at: new Date().toISOString() });
console.log(`Copied. SSP now has ${all.length} practices.`);
