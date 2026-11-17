// Discount codes. The team creates them in the console (Emails → Discount codes); a practice
// types one on the registration form, or arrives with it filled in from the link in its email.
//
// A code is { code, kind: "amount" | "percent", value, expires (YYYY-MM-DD, optional), max
// (uses, optional), note, active }. All codes live in one journey row, "codes", so every backend
// keeps them without a new table.
//
// On SSP a signed-out visitor can't read the database, so saving codes also publishes a lookup
// to the public store, keyed by a hash of each code: the list of codes is never readable, only
// the details of a code someone already knows. The console re-checks every discount from the
// real codes, so an edited browser can't award itself one.
import { getJourneyState, saveJourneyState, listPractices } from "./store.js";
import { sspOn, kv } from "./ssp.js";
import { norm, describe, usable } from "./discount.js";
export { norm, describe, amountOff, usable } from "./discount.js";

export async function getCodes() {
  const row = (await getJourneyState()).find((r) => r.id === "codes");
  return (row && row.vars && row.vars.codes) || {};
}
export async function usesByCode(practices) {
  const list = practices || (await listPractices()), out = {};
  list.forEach((p) => { if (p.discountCode) out[p.discountCode] = (out[p.discountCode] || 0) + 1; });
  return out;
}

export function cleanCode(b) {
  const code = norm(b.code);
  if (code.length < 3) throw Object.assign(new Error("A code needs at least 3 letters or numbers."), { status: 400 });
  const kind = b.kind === "percent" ? "percent" : "amount";
  const value = Math.round(Number(b.value));
  if (!(value > 0) || (kind === "percent" && value > 100) || value > 10000) throw Object.assign(new Error(kind === "percent" ? "Enter a percentage from 1 to 100." : "Enter the dollar amount off."), { status: 400 });
  const expires = /^\d{4}-\d{2}-\d{2}$/.test(String(b.expires || "")) ? b.expires : "";
  const max = Math.max(0, Math.round(Number(b.max) || 0));
  return { code, kind, value, expires, max, note: String(b.note || "").trim().slice(0, 200), active: b.active !== false };
}

// Saves the whole set and, on SSP, republishes the public lookup.
export async function saveCodes(codes, me) {
  await saveJourneyState("codes", { vars: { codes }, updated_by: me });
  await publishCodes(codes);
}
async function slot(code) {
  const d = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode("pls-code:" + norm(code)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
export async function publishCodes(codes, practices) {
  if (!sspOn()) return;
  const uses = await usesByCode(practices), pub = {};
  for (const c of Object.values(codes)) {
    const st = usable(c, uses[c.code] || 0);
    pub[await slot(c.code)] = st === "ok" ? { kind: c.kind, value: c.value, expires: c.expires || "" } : { closed: st };
  }
  await kv.set("codes", pub);
}

// What the registration form needs to know about a typed code, or why it can't be used.
export async function checkCode(raw) {
  const code = norm(raw);
  if (!code) return { ok: false, reason: "empty" };
  if (sspOn()) {
    const pub = (await kv.get("codes").catch(() => null)) || {};
    const c = pub[await slot(code)];
    if (!c) return { ok: false, code, reason: "unknown" };
    if (c.closed) return { ok: false, code, reason: c.closed };
    return { ok: true, code, kind: c.kind, value: c.value, expires: c.expires, label: describe(c) };
  }
  const c = (await getCodes())[code];
  const st = usable(c, c ? (await usesByCode())[code] || 0 : 0);
  if (st !== "ok") return { ok: false, code, reason: st };
  return { ok: true, code, kind: c.kind, value: c.value, expires: c.expires, label: describe(c) };
}
