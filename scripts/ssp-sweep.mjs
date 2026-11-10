// Sends the emails the website's signed-out forms can't send on SSP (confirmation, team notice,
// pre-work thanks), then the approved journey emails that are due, and updates the public table
// count. Run by .github/workflows/ssp-sweep.yml every 15 minutes; safe to run by hand:
//
//   SSP_SITE_API_KEY=ssp_site_… node scripts/ssp-sweep.mjs
//
//   SSP_SITE_DOMAIN  the site's domain on the platform (default practice-leadership-summit.amalandco.com)
//   SSP_BASE_URL     where to reach it (default https://<domain>)
//   DRY_RUN=1        only list what the journey would send
process.env.STORE_BACKEND = "ssp";
process.env.SSP_SITE_DOMAIN ||= "practice-leadership-summit.amalandco.com";
process.env.SITE_URL ||= process.env.SSP_BASE_URL || "https://" + process.env.SSP_SITE_DOMAIN;
if (!process.env.SSP_SITE_API_KEY) { console.error("Set SSP_SITE_API_KEY (SSP dashboard → the site → API key)."); process.exit(1); }

const { sweep, runJourney } = await import("../api/_lib/notify.js");
try {
  const out = process.env.DRY_RUN === "1" ? { dry: await runJourney({ dry: true }) } : await sweep();
  console.log(JSON.stringify(out, null, 2));
  if (out.failed && out.failed.length) process.exitCode = 1;
} catch (e) {
  console.error("Sweep failed:", e.message);
  process.exit(1);
}
