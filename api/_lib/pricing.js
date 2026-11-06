// Ticket prices, the same ladder as the website's price builder and the Airtable Price formula.
export const EARLY_END = Date.parse("2026-12-05T00:00:00-05:00");
const CORE = { "Single seat": 1, "Team of 2": 2, "Team of 3": 3, "Team of 4 or more": 3 };

export function peopleFor(ticket, extra) {
  const core = CORE[ticket] || 1;
  return ticket === "Team of 4 or more" ? core + Math.max(1, Math.min(6, Number(extra) || 1)) : core;
}

export function priceFor(ticket, extra, kasper, at = Date.now()) {
  const core = CORE[ticket] || 1, early = at < EARLY_END;
  let base = { 1: [2100, 2500], 2: [2700, 3100], 3: [3400, 3800] }[core][early ? 0 : 1];
  if (kasper && core === 3 && base > 3040) base = 3040;
  const more = ticket === "Team of 4 or more" ? Math.max(1, Math.min(6, Number(extra) || 1)) : 0;
  return base + more * 600;
}
