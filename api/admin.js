// /api/admin — everything the team console reads and changes. Signed-in team members only.
import { readBody, str, send } from "./_lib/airtable.js";
import { sessionEmail } from "./_lib/auth.js";
import { backend, listPractices, listPrework, getPractice, getPrework, updatePractice, saveJourneyState, emailLog } from "./_lib/store.js";
import { JOURNEY, AUDIENCES, GLOBAL_VARS, renderJourney, inAudience, nextDate } from "./_lib/journey.js";
import { journeyState, sendReport, broadcast, runJourney } from "./_lib/notify.js";
import { sendEmail, emailReady, getOutbox, sender } from "./_lib/email.js";
import { reviewsFor, reviewsReady, draftFromPasted } from "./_lib/reviews.js";

const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });

export default async function handler(req, res) {
  try {
    const me = sessionEmail(req);
    if (!me) return send(res, 401, { ok: false, error: "Please sign in." });
    if (req.method === "GET") return send(res, 200, await data(me));
    if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use GET or POST." });
    const b = readBody(req);
    switch (b.a) {
      case "update": {
        const cur = await getPractice(str(b.id, 80)); if (!cur) throw fail("That practice wasn’t found.", 404);
        if (b.patch && b.patch.reportStatus && b.patch.reportStatus !== "Draft" && !(await getPrework(cur.number))) throw fail("This office hasn’t sent its pre-work yet, so there’s no report to release.");
        return send(res, 200, { ok: true, practice: await updatePractice(cur.id, b.patch, cur) });
      }
      case "sendReport": {
        let p = await getPractice(str(b.id, 80)); if (!p) throw fail("That practice wasn’t found.", 404);
        const pw = await getPrework(p.number); if (!pw) throw fail("No pre-work yet, so there’s no report to send.");
        if (!p.reportKey || p.reportStatus === "Draft") p = await updatePractice(p.id, { reportStatus: "Ready" }, p);
        const r = await sendReport(p, pw);
        if (!r.ok) throw fail("The email didn’t go: " + (r.error || "unknown error"), 502);
        p = await updatePractice(p.id, { reportStatus: "Sent" }, p);
        return send(res, 200, { ok: true, practice: p, local: !!r.local });
      }
      case "journey": {
        const id = str(b.id, 10);
        if (id === "vars") {
          const vars = {}; Object.keys(GLOBAL_VARS).forEach((k) => { if (b.vars && b.vars[k] != null) vars[k] = str(String(b.vars[k]), 300); });
          await saveJourneyState("vars", { vars, updated_by: me }); return send(res, 200, { ok: true });
        }
        if (!JOURNEY.some((d) => d.id === id)) throw fail("Unknown email.", 404);
        const patch = { updated_by: me };
        if (["draft", "approved", "paused"].includes(b.status)) patch.status = b.status;
        if (typeof b.subject === "string") patch.subject = b.subject.trim().slice(0, 200) || null;
        if (typeof b.body === "string") patch.body = b.body.trim().slice(0, 8000) || null;
        await saveJourneyState(id, patch); return send(res, 200, { ok: true });
      }
      case "preview": {
        const d = JOURNEY.find((x) => x.id === b.id); if (!d) throw fail("Unknown email.", 404);
        const st = (await journeyState())[d.id] || {};
        const draft = { ...st, subject: typeof b.subject === "string" ? b.subject : st.subject, body: typeof b.body === "string" ? b.body : st.body };
        const p = b.practiceId ? await getPractice(str(b.practiceId, 80)) : sample();
        const pw = p && p.number && b.practiceId ? await getPrework(p.number) : null;
        return send(res, 200, { ok: true, ...renderJourney(d, p, pw, draft) });
      }
      case "test": {
        const d = JOURNEY.find((x) => x.id === b.id); if (!d) throw fail("Unknown email.", 404);
        const st = (await journeyState())[d.id] || {};
        const m = renderJourney(d, sample(), null, st);
        const r = await sendEmail({ to: me, subject: "[Test] " + m.subject, html: m.html, text: m.text, tag: "test" });
        if (!r.ok) throw fail("The test didn’t go: " + r.error, 502);
        return send(res, 200, { ok: true, local: !!r.local });
      }
      case "reviews": {
        const p = await getPractice(str(b.id, 80)); if (!p) throw fail("That practice wasn’t found.", 404);
        return send(res, 200, { ok: true, ...(await reviewsFor(p)) });
      }
      case "pasteReviews": {
        const p = await getPractice(str(b.id, 80)); if (!p) throw fail("That practice wasn’t found.", 404);
        const r = draftFromPasted(p.name, String(b.text || "").slice(0, 12000), b.rating, b.count);
        if (!r.reviews) throw fail("Paste at least one review, one per paragraph.");
        return send(res, 200, { ok: true, ...r });
      }
      case "broadcast": return send(res, 200, { ok: true, results: await broadcast(str(b.id, 10)) });
      case "dryRun": return send(res, 200, { ok: true, results: await runJourney({ dry: true, now: b.date ? Date.parse(b.date + "T15:00:00Z") : Date.now() }) });
      case "outbox": return send(res, 200, { ok: true, outbox: getOutbox().slice(0, 30).map((m) => ({ ...m, html: undefined })) });
      default: throw fail("Unknown action.");
    }
  } catch (e) {
    if (!e.status) console.error(e);
    return send(res, e.status || 500, { ok: false, error: e.message || "Something went wrong." });
  }
}

function sample() {
  return { id: "sample", number: 7, reference: "PLS-007", name: "Riverside Family Dental", town: "Clifton", ticket: "Team of 3", people: 3, price: 3400,
    owner: { name: "Dr. Maya Patel", email: "owner@example.com" }, members: [{ name: "Jordan Lee", role: "Office manager" }, { name: "Sam Ortiz", role: "Hygienist" }],
    reportKey: "SAMPLE-LINK-ONLY", checkedIn: [true, true, false, false], createdAt: new Date().toISOString() };
}

async function data(me) {
  const [practices, pre, st, log] = await Promise.all([listPractices(), listPrework(), journeyState(), emailLog(400)]);
  const sentBy = {}; log.filter((l) => l.status === "sent").forEach((l) => { sentBy[l.email_id] = (sentBy[l.email_id] || 0) + 1; });
  const journey = JOURNEY.map((d) => {
    const s = st[d.id] || {};
    return { id: d.id, name: d.name, when: d.when, type: d.schedule.type, date: nextDate(d), audience: d.audience, audienceLabel: AUDIENCES[d.audience],
      status: d.id === "e01" ? "automatic" : s.status || (d.id === "e07" ? "paused" : "draft"), edited: !!(s.subject || s.body),
      subject: s.subject || d.subject, body: s.body || d.body, defaultSubject: d.subject, defaultBody: d.body,
      reach: practices.filter((p) => inAudience(d.audience, p, pre[p.number])).length, sent: sentBy[d.id] || 0, updatedBy: s.updated_by || "", updatedAt: s.updated_at || "" };
  });
  return {
    ok: true, me, backend: backend(), emailReady: emailReady(), from: sender(), reviewsReady: reviewsReady(),
    practices: practices.map((p) => ({ ...p, pw: pre[p.number] || null })),
    journey, vars: (st.vars && st.vars.vars) || (st.e01 && st.e01.vars) || {}, varLabels: GLOBAL_VARS,
    log: log.slice(0, 120).map((l) => ({ at: l.created_at, emailId: l.email_id, to: l.to_addr, subject: l.subject, status: l.status, error: l.error, practiceId: l.practice_id })),
  };
}
