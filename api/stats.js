// GET /api/stats — how many practice tables are claimed (drives the live floor plan).
import { countPractices, send } from "./_lib/airtable.js";

export default async function handler(req, res) {
  try {
    const claimed = await countPractices();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ claimed, total: 35 }));
  } catch (e) {
    return send(res, 200, { claimed: 0, total: 35, unavailable: true });
  }
}
