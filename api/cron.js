// /api/cron — runs every morning from Vercel Cron (see vercel.json) and sends the approved
// journey emails that are due. Vercel signs the call with CRON_SECRET.
import { send } from "./_lib/airtable.js";
import { runJourney } from "./_lib/notify.js";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return send(res, 401, { ok: false });
  try {
    const results = await runJourney();
    console.log("journey run", JSON.stringify(results));
    return send(res, 200, { ok: true, sent: results.filter((r) => r.ok).length, results });
  } catch (e) {
    console.error(e); return send(res, 500, { ok: false, error: e.message });
  }
}
