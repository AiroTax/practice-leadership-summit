// Airtable access for the summit website. The token never reaches the browser.
// Set AIRTABLE_TOKEN in your hosting environment (see README). Set AIRTABLE_MOCK=1
// to run against an in-memory store for local testing.

export const BASE_ID = process.env.AIRTABLE_BASE_ID || "appnkdigwysCU2SCH";
export const TABLES = { practices: "tblzLoaqlyzo5vlzn", prework: "tbl7jJbYfm6Px1h8L" };

// Field IDs in the "Practice Leadership Summit 2027" base.
export const P = {
  name: "fld0rz9lr0hIYjlgs", number: "fldDJzC6IpP1pr99K", reference: "fldB1NYGYMBIZJdqL", price: "fldblcgU8dA3rOjNc",
  town: "fldip02cFXrfufn3I", type: "fldCCmOhhTOMehAeD", ticket: "fldrjRwgfcEy4JpfN", extra: "fldEDUYnkTvjuCx8v",
  kasper: "fldF7BPOahfiGUSN3", ownerName: "fldRcY9rNwuVGit22", ownerEmail: "fldRo1Htu3wLzuNXb", ownerPhone: "fldnLVZ9wWCT5zlBI",
  members: [
    { name: "fld2euui3Y0WJtQW6", role: "fldLrJx73DgnIOL7J", email: "fldoDlfcNVhwA2dY5" },
    { name: "fldQ77D2XRbjgpKxH", role: "fldfBPcRUXzWBSCK8", email: "fldi6g5ssTfZDf5Qy" },
    { name: "fldzA6vxYmKOj3rTY", role: "fldo0xnZywb7wLmd2", email: "fld1TAqQmp5K7PaIM" },
  ],
  heard: "fldN31vIvQxzANY0n", referredBy: "fld3iw5ix49qcn2BM", diet: "fldr4DH7Al9mLhW4G", access: "fldPZ8gBSBzToRCcD",
  photo: "fld1Qhf5BJyX3nc5U", kasperUpdates: "fldG0EVPu4TEQ95mv", gadUpdates: "fldELUyW2Pq53zTGu", partnerIntros: "fld2uhU7JcaJe01QC",
  terms: "fldnxRo2WJYgtRhfl", website: "fldQFOdZqMn0nkVpX", invoiceEmail: "fldiolIO15zYFo9kN", hotel: "fld69foj3pc9Yo3H3",
};
export const W = {
  practice: "fldWCLfx5PTn1x2cd", number: "fldr2cS8IAIZ4NYlr", email: "fldxWelk1VyNXyVro", years: "fldsfbXQBYzRVwYLd",
  locations: "fldWW0doQGHSbDvR5", teamSize: "fld7wvr9MSjXKMhLc", newPatients: "fld0NwAsiIDOJB9Sa", payerMix: "fldIw5lXGFldLEvSC",
  production: "fld3bXBR2ylfjEucp", technology: "fldpvyoTQ8sUIswbJ", compared: "fldqr8qkhVfZSu7JU", challenges: "fldGIkAiLyAM4ERG1",
  goodWeekend: "fld5UUTMRINsH8VDy", callTime: "fldse9cXqH9ryeydh",
};

const API = "https://api.airtable.com/v0";

async function airtable(path, init = {}) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw Object.assign(new Error("Registration is not configured yet (missing AIRTABLE_TOKEN)."), { status: 503 });
  const res = await fetch(`${API}/${BASE_ID}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Airtable error", res.status, JSON.stringify(json));
    throw Object.assign(new Error("We couldn't save that just now. Please try again in a minute."), { status: 502 });
  }
  return json;
}

// ---------- in-memory mock (AIRTABLE_MOCK=1) ----------
const mock = globalThis.__summitMock || (globalThis.__summitMock = { practices: [], prework: [], n: 0 });
const isMock = () => process.env.AIRTABLE_MOCK === "1";

export async function createRecord(table, fields) {
  if (isMock()) {
    const rec = { id: "recMOCK" + Math.random().toString(36).slice(2, 12), createdTime: new Date().toISOString(), fields: { ...fields } };
    if (table === TABLES.practices) {
      const n = ++mock.n;
      rec.fields[P.number] = n;
      rec.fields[P.reference] = "PLS-" + String(n).padStart(3, "0");
      mock.practices.push(rec);
    } else mock.prework.push(rec);
    return rec;
  }
  const out = await airtable(TABLES[table] ? TABLES[table] : table, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true, returnFieldsByFieldId: true }),
  });
  return out.records[0];
}

export async function getRecord(table, id) {
  if (isMock()) return (table === TABLES.practices ? mock.practices : mock.prework).find((r) => r.id === id);
  return airtable(`${table}/${id}?returnFieldsByFieldId=true`);
}

export async function findPracticeByNumber(num) {
  if (isMock()) return mock.practices.find((r) => r.fields[P.number] === num) || null;
  const q = new URLSearchParams({ filterByFormula: `{Registration #}=${Number(num)}`, maxRecords: "1", returnFieldsByFieldId: "true" });
  q.append("fields[]", P.name);
  const out = await airtable(`${TABLES.practices}?${q}`);
  return out.records[0] || null;
}

export async function countPractices() {
  if (isMock()) return mock.practices.length;
  let count = 0, offset;
  do {
    const q = new URLSearchParams({ pageSize: "100" });
    q.append("fields[]", P.number);
    if (offset) q.set("offset", offset);
    const out = await airtable(`${TABLES.practices}?${q}`);
    count += out.records.length;
    offset = out.offset;
  } while (offset);
  return count;
}

// ---------- shared request helpers ----------
export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
export const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Best-effort per-instance rate limit: 8 submissions per IP per 10 minutes.
const hits = globalThis.__summitHits || (globalThis.__summitHits = new Map());
export function rateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 600000);
  list.push(now); hits.set(ip, list);
  return list.length > 8;
}
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
