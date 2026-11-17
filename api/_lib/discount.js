// The arithmetic of discount codes, with no imports, so the store, the emails and the
// registration form can all use it (see codes.js for where codes are kept).
export const norm = (c) => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
const money = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");

export function describe(c) { return c.kind === "percent" ? `${c.value}% off` : `${money(c.value)} off`; }
// The discount in dollars on a ticket that costs `base`.
export function amountOff(c, base) {
  if (!c) return 0;
  const off = c.kind === "percent" ? Math.round((base * Math.min(100, c.value)) / 100) : Math.round(c.value);
  return Math.max(0, Math.min(base, off));
}
const today = (now = Date.now()) => new Date(now - 5 * 3600e3).toISOString().slice(0, 10); // Eastern date
export function usable(c, uses = 0, now = Date.now()) {
  if (!c) return "unknown";
  if (!c.active) return "off";
  if (c.expires && today(now) > c.expires) return "expired";
  if (c.max && uses >= c.max) return "used up";
  return "ok";
}

