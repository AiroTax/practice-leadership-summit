/* Practice Snapshot report. One module for two places: the office's private report page on the
   website (report.html) and the team console (a copy is inlined there by `npm run report-copy`).
   Input: { practice:{name,town,type,ticket,count,people:[{name,role}],website}, answers:{<question key>: value},
            note: "facilitator note", preparedOn: ISO date }.
   Benchmarks are published industry figures; each carries its source. */
(function (root) {
  "use strict";

  var SOURCES = {
    hs1: { label: "Henry Schein One, 2024 Industry Report (2,500+ US practices), via Becker’s Dental", url: "https://www.beckersdental.com/dentists/where-dental-practices-stand-on-scheduling-patient-retention.html" },
    hs1ca: { label: "Henry Schein One, 2024 Industry Report, via Becker’s Dental", url: "https://www.beckersdental.com/?p=11714" },
    act: { label: "ACT Dental, hygiene re-appointment guidance", url: "https://www.actdental.com/blog/data-snapshot-hygiene-re-appointment-percentage" },
    de: { label: "Dental Economics, Tracking dental practice overhead (A. Schiff, CPA, 2021)", url: "https://www.dentaleconomics.com/practice/overhead-and-profitability/article/14201431/how-does-your-overhead-compare-to-national-averages" },
    oj: { label: "Overjet, new-patient and active-patient guidance (2025)", url: "https://www.overjet.com/blog/how-many-new-patients-should-your-dental-practice-target-monthly-in-2025" }
  };
  // tone: good, ok, warn, bad, none
  var TONE_LABEL = { good: "Ahead", ok: "On par", warn: "Behind", bad: "Well behind", none: "Not tracked" };

  var ACTIVE_MID = { "Under 1,000": 750, "1,000–2,500": 1750, "2,500–5,000": 3750, "5,000–10,000": 7500, "Over 10,000": 11000 };
  var PROD_MID = { "Under $100k": 75000, "$100k–$200k": 150000, "$200k–$400k": 300000, "$400k–$800k": 600000, "Over $800k": 900000 };
  var MAPS = {
    reappoint: { "80% or more": 5, "60–80%": 3, "Under 60%": 2, "We don't track it": 1 },
    trend: { "Up more than 10%": 5, "Up a little": 4, "About the same": 3, "Down": 1, "Open less than a year": 3 },
    overhead: { "Under 60%": 5, "60–70%": 4, "70–80%": 3, "Over 80%": 1, "Not sure": 2 },
    caseAccept: { "70% or more": 5, "About half": 3, "Less than half": 2, "We don't track it": 1 },
    turnover: { "Nobody": 5, "1–2 people": 4, "3–5 people": 2, "6 or more": 1 },
    meetings: { "Daily huddle": 5, "Weekly": 4, "Monthly": 2, "Rarely": 1 },
    npSource: { "Patient referrals": 4, "Google and online search": 4, "Insurance directory": 2, "Social media": 3, "Location and walk-ins": 3, "Other": 3 }
  };

  function str(v) { return v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function list(v) { return Array.isArray(v) ? v : v ? String(v).split(/,\s*/) : []; }
  function avg(a) { a = a.filter(function (x) { return x; }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function money(n) { return "$" + Math.round(n || 0).toLocaleString("en-US"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- the benchmark table ---------- */
  function kpis(a) {
    var out = [];
    var np = num(a.newPatients);
    if (a.newPatients !== undefined && a.newPatients !== "") out.push({
      name: "New patients a month", yours: np + (num(a.dentists) > 1 ? " (" + Math.round(np / num(a.dentists)) + " per dentist)" : ""),
      bench: "35 a month on average; 86 in the top 10% of practices", src: "hs1",
      tone: np >= 50 ? "good" : np >= 30 ? "ok" : np >= 20 ? "warn" : "bad"
    });
    if (a.reappoint) out.push({
      name: "Hygiene patients reappointed", yours: a.reappoint,
      bench: "At least 85% recommended; 77% is the average, 94% the top 10%", src: "act", src2: "hs1",
      tone: { "80% or more": "ok", "60–80%": "warn", "Under 60%": "bad", "We don't track it": "none" }[a.reappoint] || "none"
    });
    if (a.caseAccept) out.push({
      name: "Treatment plans accepted", yours: a.caseAccept,
      bench: "46% on average; 83% in the top 10%", src: "hs1ca",
      tone: { "70% or more": "good", "About half": "ok", "Less than half": "warn", "We don't track it": "none" }[a.caseAccept] || "none"
    });
    if (a.overhead) out.push({
      name: "Overhead, share of collections", yours: a.overhead,
      bench: "About 60% is a reasonable target; staff costs under 28%", src: "de",
      tone: { "Under 60%": "good", "60–70%": "ok", "70–80%": "warn", "Over 80%": "bad", "Not sure": "none" }[a.overhead] || "none"
    });
    var act = ACTIVE_MID[a.activePatients], dent = num(a.dentists);
    if (act && dent) {
      var per = act / dent;
      out.push({
        name: "Active patients per full-time dentist", yours: "About " + (Math.round(per / 50) * 50).toLocaleString("en-US") + " (" + a.activePatients + " across " + dent + (dent === 1 ? " dentist" : " dentists") + ")",
        bench: "1,500 to 1,800 per full-time dentist", src: "oj",
        tone: per > 2200 ? "good" : per >= 1500 ? "ok" : per >= 1200 ? "warn" : "bad"
      });
    }
    return out;
  }

  /* ---------- scorecard: their numbers against how they rated themselves ---------- */
  function analyse(a) {
    var dent = num(a.dentists), np = num(a.newPatients), ops = num(a.operatories), tools = list(a.tools).length;
    var npd = dent ? np / dent : 0, npScore = !np ? 0 : npd >= 25 ? 5 : npd >= 15 ? 4 : npd >= 8 ? 3 : 2;
    var data = {
      Patients: avg([MAPS.reappoint[a.reappoint], npScore]),
      Team: avg([MAPS.turnover[a.turnover], MAPS.meetings[a.meetings]]),
      Technology: tools ? Math.max(1, Math.round(1 + tools / 9 * 4)) : 0,
      Finances: avg([MAPS.trend[a.trend], MAPS.overhead[a.overhead], MAPS.caseAccept[a.caseAccept]]),
      "Market position": MAPS.npSource[a.npSource] || 0
    };
    var self = { Patients: num(a.sPatients), Team: num(a.sTeam), Technology: num(a.sTech), Finances: num(a.sFinances), "Market position": num(a.sMarket) };
    var flags = [], good = [];
    if (a.overhead === "Over 80%") flags.push("Overhead is over 80% of collections, against a target of about 60%. There is little room to fund the plan until that moves.");
    if (a.overhead === "Not sure") flags.push("Overhead isn’t tracked yet. Knowing it is the first step to funding your plan.");
    if (a.reappoint === "Under 60%" || a.reappoint === "We don't track it") flags.push("Hygiene reappointment is " + (a.reappoint === "Under 60%" ? "under 60%, against a recommended 85%" : "not tracked") + ". Retention is usually the quickest win.");
    if (a.caseAccept === "Less than half" || a.caseAccept === "We don't track it") flags.push("Treatment acceptance is " + (a.caseAccept === "Less than half" ? "below half" : "not tracked") + ". Practices in the top 10% accept 83% of planned treatment.");
    if (a.turnover === "3–5 people" || a.turnover === "6 or more") flags.push(a.turnover + " left in the last year. Team stability will shape how much the plan can take on.");
    if (a.meetings === "Rarely") flags.push("The whole team rarely meets. A 90-day plan needs a weekly rhythm to hold.");
    if (a.change === "Resists quietly" || a.change === "Pushes back openly") flags.push("The team " + a.change.toLowerCase().replace("resists", "resists change").replace("pushes back", "pushes back on change") + ". We’ll work on this in Negotiating change with your team.");
    if (a.trend === "Down") flags.push("Production is down on last year.");
    var pay = [num(a.ppo), num(a.medicaid), num(a.ffs)], payT = pay[0] + pay[1] + pay[2];
    if (pay[1] >= 40 && a.direction !== "Scale with Medicaid") flags.push("Medicaid is " + pay[1] + "% of patients, but scaling with Medicaid isn’t your chosen direction. Worth deciding on purpose.");
    Object.keys(data).forEach(function (k) {
      if (data[k] && self[k] && self[k] - data[k] >= 2) flags.push("You rate " + k.toLowerCase() + " " + self[k] + " of 5; your answers point to about " + data[k].toFixed(1) + ".");
      if (data[k] && self[k] && data[k] - self[k] >= 2) good.push("Stronger on " + k.toLowerCase() + " than you think: about " + data[k].toFixed(1) + " against your " + self[k] + ".");
    });
    if (a.reappoint === "80% or more") good.push("Hygiene reappointment of 80% or more, close to the 85% recommendation.");
    if (a.caseAccept === "70% or more") good.push("Treatment acceptance of 70% or more, well above the 46% average.");
    if (a.overhead === "Under 60%") good.push("Overhead under 60% of collections, better than the usual target.");
    if (a.trend === "Up more than 10%") good.push("Production up more than 10% on last year.");
    if (np >= 35) good.push(np + " new patients a month, " + (np >= 50 ? "well above" : "at or above") + " the 35-a-month average.");
    var actMid = ACTIVE_MID[a.activePatients]; if (actMid && dent && actMid / dent >= 1500) good.push("A full patient base: about " + (Math.round(actMid / dent / 50) * 50).toLocaleString("en-US") + " active patients per dentist.");
    if (a.turnover === "Nobody") good.push("Nobody left the team in the last year.");
    if (tools >= 6) good.push("Uses " + tools + " of 9 common practice tools.");
    if (a.meetings === "Daily huddle") good.push("A daily huddle is already in place to carry the plan.");
    var prod = PROD_MID[a.production], perChair = prod && ops ? prod / ops : 0;
    return { data: data, self: self, flags: flags, good: good, pay: pay, payT: payT, perChair: perChair, tools: tools, npd: npd };
  }

  function profileLine(a, an) {
    var bits = [];
    if (a.years !== undefined && a.years !== "") bits.push(a.years + " years open");
    if (a.locations) bits.push(a.locations + (num(a.locations) === 1 ? " location" : " locations"));
    if (a.operatories) bits.push(a.operatories + " operatories");
    if (a.dentists) bits.push(a.dentists + (num(a.dentists) === 1 ? " dentist" : " dentists"));
    if (a.hygienists) bits.push(a.hygienists + " hygienists");
    if (a.teamSize) bits.push("a team of " + a.teamSize);
    var s = bits.join(", ") + (bits.length ? "." : "");
    if (a.software) s += " Runs " + a.software + ".";
    if (a.production) s += " Production " + a.production + " a month" + (an.perChair ? ", about " + money(an.perChair) + " per operatory" : "") + ".";
    return s.trim();
  }

  /* ---------- status for the admin overview ---------- */
  function summary(a) {
    var k = kpis(a), an = analyse(a);
    var count = { good: 0, ok: 0, warn: 0, bad: 0, none: 0 };
    k.forEach(function (x) { count[x.tone]++; });
    return { kpis: k, analysis: an, counts: count, priorities: an.flags.length };
  }

  /* ---------- the report ---------- */
  var CSS = '\
.rp{--ink:#0B1A33;--ink2:#3A4560;--muted:#5F6A84;--line:#DCE1EB;--sunk:#F2F4F9;--accent:#C22158;--good:#137A55;--good-s:#DDF2E8;--ok:#2F5BD3;--ok-s:#E3EAFB;--warn:#9A5B00;--warn-s:#FBEFD9;--bad:#B3283A;--bad-s:#FBE4E7;\
 color:var(--ink);background:#fff;font:15px/1.6 "Atkinson Hyperlegible","Segoe UI",sans-serif;max-width:860px;margin:0 auto;padding:44px 48px 40px;border-radius:6px;box-shadow:0 30px 60px -36px rgba(11,26,51,.35);display:grid;gap:30px}\
.rp h1,.rp h2,.rp h3{font-family:"Bricolage Grotesque","Avenir Next",sans-serif;margin:0;letter-spacing:-.01em;color:var(--ink)}\
.rp p{margin:0}\
.rp-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:3px solid var(--ink);padding-bottom:20px}\
.rp-top h1{font-size:34px;font-weight:800;line-height:1.05}\
.rp-kick{font-weight:700;color:var(--accent);font-size:14px;margin-bottom:6px}\
.rp-meta{text-align:right;font-size:13px;color:var(--muted);white-space:nowrap}\
.rp-meta b{display:block;color:var(--ink);font-size:14px}\
.rp-sub{color:var(--ink2);margin-top:6px}\
.rp-sec{display:grid;gap:12px;align-content:start}\
.rp-sec > h2{font-size:20px;font-weight:700}\
.rp-note{background:var(--sunk);border-radius:12px;padding:16px 18px;color:var(--ink2);white-space:pre-wrap}\
.rp-note b{display:block;color:var(--ink);margin-bottom:4px}\
.rp-two{display:grid;grid-template-columns:1fr 1fr;gap:18px}\
.rp-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}\
.rp-list li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;font-size:14.5px}\
.rp-list li::before{content:"";width:12px;height:12px;border-radius:50%;margin-top:5px}\
.rp-list.good li::before{background:var(--good)}\
.rp-list.pri li::before{background:var(--warn)}\
.rp-table{width:100%;border-collapse:collapse;font-size:14px}\
.rp-table th{text-align:left;font-size:12.5px;color:var(--muted);font-weight:700;padding:8px 10px;border-bottom:2px solid var(--ink)}\
.rp-table td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top}\
.rp-table td:first-child{font-weight:700}\
.rp-table sup{font-size:10px;color:var(--muted)}\
.rp-pill{display:inline-block;font-weight:700;font-size:12px;padding:3px 10px;border-radius:999px;white-space:nowrap}\
.rp-pill.good{background:var(--good-s);color:var(--good)}.rp-pill.ok{background:var(--ok-s);color:var(--ok)}.rp-pill.warn{background:var(--warn-s);color:var(--warn)}.rp-pill.bad{background:var(--bad-s);color:var(--bad)}.rp-pill.none{background:var(--sunk);color:var(--muted)}\
.rp-score{display:grid;grid-template-columns:130px minmax(0,1fr) 70px;gap:12px;align-items:center;font-size:14px}\
.rp-track{position:relative;height:10px;background:var(--sunk);border-radius:5px}\
.rp-track i{position:absolute;left:0;top:0;bottom:0;background:var(--ink);border-radius:5px}\
.rp-track b{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--accent);border:2.5px solid #fff}\
.rp-score span:last-child{text-align:right;color:var(--muted);font-variant-numeric:tabular-nums;font-size:13px}\
.rp-key{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted)}\
.rp-key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}\
.rp-payer{display:flex;height:14px;border-radius:7px;overflow:hidden;background:var(--sunk)}\
.rp-payer i{display:block;height:100%}\
.rp-ol{margin:0;padding-left:20px;display:grid;gap:4px}\
.rp-foot{border-top:1px solid var(--line);padding-top:14px;font-size:12px;color:var(--muted);display:grid;gap:4px}\
.rp-foot a{color:var(--muted)}\
@media (max-width:640px){.rp{padding:26px 18px;gap:24px}.rp-top{flex-direction:column}.rp-meta{text-align:left}.rp-two{grid-template-columns:1fr}.rp-score{grid-template-columns:96px minmax(0,1fr) 56px}.rp-table th:nth-child(3),.rp-table td:nth-child(3){display:none}.rp-top h1{font-size:28px}}\
@media print{.rp{box-shadow:none;max-width:none;padding:0}.rp-sec{break-inside:avoid}}';

  function render(d) {
    var a = d.answers || {}, p = d.practice || {}, an = analyse(a), k = kpis(a);
    var date = new Date(d.preparedOn || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    var srcKeys = []; k.forEach(function (x) { [x.src, x.src2].forEach(function (s) { if (s && srcKeys.indexOf(s) < 0) srcKeys.push(s); }); });
    var sup = function (s, s2) { return '<sup>' + [s, s2].filter(Boolean).map(function (x) { return srcKeys.indexOf(x) + 1; }).join(", ") + '</sup>'; };
    var team = (p.people || []).map(function (m) { return esc(m.name) + (m.role ? " (" + esc(m.role.toLowerCase()) + ")" : ""); }).join(", ");
    var priorities = an.flags.slice(0, 4), strengths = an.good.slice(0, 4);
    var ch = str(a.challenges).split("\n").map(function (c) { return c.replace(/^\d+\.\s*/, "").trim(); }).filter(Boolean);
    var h = '<article class="rp">';
    h += '<header class="rp-top"><div><p class="rp-kick">Practice Snapshot</p><h1>' + esc(p.name) + '</h1><p class="rp-sub">' + esc([p.town, p.type].filter(Boolean).join(" · ")) + (team ? '<br>' + team : '') + '</p></div>' +
      '<div class="rp-meta"><b>Practice Leadership Summit</b>Jan 9–10, 2027, New Jersey<br>Prepared ' + esc(date) + '<br>Kasper with Global Academy of Dentistry</div></header>';
    if (d.note) h += '<div class="rp-note"><b>From your facilitator</b>' + esc(d.note) + '</div>';
    h += '<section class="rp-two"><div class="rp-sec"><h2>What’s working</h2><ul class="rp-list good">' + (strengths.length ? strengths.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") : '<li>We’ll find your strengths together on the welcome call.</li>') + '</ul></div>' +
      '<div class="rp-sec"><h2>Where to focus first</h2><ul class="rp-list pri">' + (priorities.length ? priorities.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") : '<li>No warning signs in your answers. Day 1 will test that against your numbers.</li>') + '</ul></div></section>';
    if (k.length) h += '<section class="rp-sec"><h2>Against industry benchmarks</h2><table class="rp-table"><thead><tr><th>Measure</th><th>Your practice</th><th>Benchmark</th><th>Status</th></tr></thead><tbody>' +
      k.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.yours) + '</td><td>' + esc(x.bench) + sup(x.src, x.src2) + '</td><td><span class="rp-pill ' + x.tone + '">' + TONE_LABEL[x.tone] + '</span></td></tr>'; }).join("") + '</tbody></table></section>';
    h += '<section class="rp-sec"><h2>Your scorecard</h2>' + Object.keys(an.data).map(function (key) {
      var dv = an.data[key], sv = an.self[key];
      return '<div class="rp-score"><span>' + key + '</span><span class="rp-track">' + (dv ? '<i style="width:' + (dv / 5 * 100) + '%"></i>' : '') + (sv ? '<b style="left:' + (sv / 5 * 100) + '%"></b>' : '') + '</span><span>' + (dv ? dv.toFixed(1) : "–") + ' / ' + (sv || "–") + '</span></div>';
    }).join("") + '<div class="rp-key"><span><i style="background:#0B1A33"></i>From your answers, out of 5</span><span><i style="background:#C22158;border-radius:50%"></i>How your team rated itself</span></div></section>';
    h += '<section class="rp-two"><div class="rp-sec"><h2>Your practice</h2><p>' + esc(profileLine(a, an)) + '</p>' +
      (an.payT ? '<div class="rp-payer"><i style="width:' + an.pay[0] + '%;background:#2F5BD3"></i><i style="width:' + an.pay[1] + '%;background:#D99A1E"></i><i style="width:' + an.pay[2] + '%;background:#137A55"></i></div><div class="rp-key"><span><i style="background:#2F5BD3"></i>PPO ' + an.pay[0] + '%</span><span><i style="background:#D99A1E"></i>Medicaid and CHIP ' + an.pay[1] + '%</span><span><i style="background:#137A55"></i>Fee-for-service ' + an.pay[2] + '%</span></div>' : '') + '</div>' +
      '<div class="rp-sec"><h2>Where you’re heading</h2><p>Three-year direction: <b>' + esc(a.direction || "to decide together") + '</b></p>' +
      (list(a.chosenFor).length ? '<p>Patients choose you for ' + esc(list(a.chosenFor).join(" and ").toLowerCase()) + '.' + (a.compared ? ' You’re compared with ' + esc(a.compared) + '.' : '') + '</p>' : '') +
      (ch.length ? '<p><b>Your three challenges</b></p><ol class="rp-ol">' + ch.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join("") + '</ol>' : '') + '</div></section>';
    h += '<section class="rp-sec"><h2>Before the weekend</h2><p>We’ll walk through this snapshot on your 20-minute welcome call' + (a.callTime ? ' (' + esc(a.callTime) + ')' : '') + '. On Day 1 your table starts from these numbers' + (a.goodWeekend ? ', aiming at what you told us a good weekend means: “' + esc(a.goodWeekend) + '”' : '') + '.</p></section>';
    h += '<footer class="rp-foot"><span>Status compares your answers with published benchmarks for US dental practices; your answers were given as ranges, so treat the comparison as a starting point.</span>' +
      srcKeys.map(function (s, i) { return '<span>' + (i + 1) + '. <a href="' + SOURCES[s].url + '" target="_blank" rel="noopener">' + esc(SOURCES[s].label) + '</a></span>'; }).join("") + '</footer>';
    return h + '</article>';
  }

  function text(d) {
    var a = d.answers || {}, p = d.practice || {}, an = analyse(a), k = kpis(a), L = [];
    L.push(p.name + ": Practice Snapshot"); L.push("");
    if (d.note) { L.push("From your facilitator: " + d.note); L.push(""); }
    L.push("What’s working:"); (an.good.length ? an.good.slice(0, 4) : ["To find together on the welcome call."]).forEach(function (x) { L.push("- " + x); });
    L.push(""); L.push("Where to focus first:"); (an.flags.length ? an.flags.slice(0, 4) : ["No warning signs in the answers."]).forEach(function (x) { L.push("- " + x); });
    L.push(""); L.push("Against industry benchmarks:"); k.forEach(function (x) { L.push("- " + x.name + ": " + x.yours + " (benchmark: " + x.bench + "). " + TONE_LABEL[x.tone] + "."); });
    L.push(""); L.push("Profile: " + profileLine(a, an));
    return L.join("\n");
  }

  root.PLS_REPORT = { render: render, text: text, summary: summary, analyse: analyse, kpis: kpis, CSS: CSS, TONE_LABEL: TONE_LABEL };
})(typeof window !== "undefined" ? window : globalThis);
