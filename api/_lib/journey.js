// The emails each practice receives, from registration to Day 90.
// Texts use the light markup described in ./email.js. {{placeholders}} are filled per practice;
// the ones in GLOBAL_VARS are typed once by the team in the console (Emails view).
// An email only goes out after the team approves it in the console, except the instant
// confirmation (e01), which is part of registering.
import { layout, markup, plain, SITE, INBOX } from "./email.js";

export const GLOBAL_VARS = {
  venue_name: "Venue name, e.g. The Grand Hotel",
  venue_address: "Venue street address",
  weather_decision: "e.g. going ahead as planned / moving to Jan 23–24",
  survey_link: "Link to the feedback survey",
  review_link: "Link to book the Day-90 review",
  payment_due: "When payment is due, e.g. within 14 days, by Dec 4",
  payment_details: "How to pay: a payment link, or bank transfer or check details",
};

const SIGN = "The Kasper summit team, in partnership with Global Academy of Dentistry";

export const JOURNEY = [
  { id: "e01", name: "Your table is held", when: "Instantly when a practice registers", schedule: { type: "instant" }, audience: "new", cc: true,
    eyebrow: "Registration confirmed", title: "Your table is held",
    subject: "{{practice}}, your table is held · Practice Leadership Summit",
    preheader: "Table {{table_no}} is yours. Here is what happens next.",
    body: `Hi {{first_name}},

Table **{{table_no}}** at the Practice Leadership Summit is now held for {{practice}}. Your reference is **{{ref}}**.

~ When: Sat Jan 9 – Sun Jan 10, 2027 · 8:00 to 5:00 both days
~ Where: North Jersey · free parking · the exact venue follows by email
~ Your team: {{team_names}}
~ Ticket: {{ticket}} · {{price}}
~ CE: up to 12 AGD PACE hours

**What happens next**

1. Your invoice follows within two business days.
2. Your pre-work takes about 20 minutes. Please send it by Dec 11; it becomes your Practice Snapshot.
3. In mid-December we send your Snapshot and book a 20-minute welcome call with your team.

[[Start your pre-work|{{prework_link}}]]

One thing to do this week: tell the people coming with you. The plan you build is theirs to run too.

See you at your table,
${SIGN}` },

  { id: "pay", name: "Payment request", when: "Sent from Today when an invoice is due, and again as a reminder", schedule: { type: "manual" }, audience: "unpaid",
    eyebrow: "Payment", title: "Your invoice for the summit",
    subject: "Invoice for {{practice}}: {{price}} · Practice Leadership Summit",
    preheader: "{{price}} for {{ticket}}, reference {{ref}}.",
    body: `Hi {{first_name}},

Thank you for registering {{practice}} for the Practice Leadership Summit. Here is what’s due to confirm your table.

~ Reference: {{ref}}
~ Ticket: {{ticket}}
~ Amount due: **{{price}}**
~ Due: {{payment_due}}

**How to pay**

{{payment_details}}

Please quote your reference **{{ref}}** with your payment. Your table stays held while payment is on its way. Need a formal invoice for your accountant, or a different arrangement? Reply to this email.

Terms: full refund to Dec 4, 50% to Dec 18, then a credit for a future event. Name changes are free.

${SIGN}` },

  { id: "e02", name: "Pre-work nudge", when: "7 days after registering, if pre-work isn’t in (until Dec 11)", schedule: { type: "after", days: 7, until: "2026-12-11" }, audience: "prework_missing",
    eyebrow: "Pre-work", title: "20 minutes now saves an hour on Jan 9",
    subject: "20 minutes now saves you an hour on Jan 9",
    preheader: "Your Practice Snapshot starts with your pre-work.",
    body: `Hi {{first_name}},

Your Practice Snapshot starts with your pre-work, and we haven’t received it yet for {{practice}}.

Rough numbers are fine: team size, new patients a month, payer mix and your top three challenges. Your office manager can fill most of it in.

[[Complete your pre-work|{{prework_link}}]]

Your registration number is **{{table_no}}**. Practices that send it early get the most useful Snapshot and the first choice of welcome-call times.

The summit team` },

  { id: "e03", name: "Two days left for pre-work", when: "Dec 9, practices without pre-work", schedule: { type: "date", date: "2026-12-09" }, audience: "prework_missing",
    eyebrow: "Pre-work closes Friday", title: "Pre-work closes Friday, Dec 11",
    subject: "Pre-work closes Friday, Dec 11",
    preheader: "After Friday we build the Practice Snapshots that open Day 1.",
    body: `Hi {{first_name}},

Pre-work for the summit closes this Friday, Dec 11. After that we build the Practice Snapshots that open Day 1.

Without yours, {{practice}} starts Saturday from a blank page while the other tables start from their own numbers.

[[Complete your pre-work|{{prework_link}}]]

It takes 20 minutes. Your registration number is **{{table_no}}**. Reply to this email if something is stopping you and we’ll help.

The summit team` },

  { id: "e04", name: "Your Practice Snapshot is ready", when: "Sent from Today or the Reports tab when a report is released", schedule: { type: "report" }, audience: "prework_in",
    eyebrow: "Practice Snapshot", title: "Your Practice Snapshot is ready",
    subject: "Your Practice Snapshot, and your welcome call",
    preheader: "Your answers set against industry benchmarks, and where to focus first.",
    body: `Hi {{first_name}},

Thank you for your pre-work. The Practice Snapshot for {{practice}} is ready: your answers set against published benchmarks for US dental practices, what’s working, and where to focus first.

[[Open your Practice Snapshot|{{report_link}}]]

The link is private to your practice, and you can save it as a PDF from the page.

Your 20-minute welcome call comes next. You asked for {{call_time}}; we’ll confirm the exact time. Bring the people coming with you if you can.

${SIGN}` },

  { id: "e05", name: "One question for the holidays", when: "Dec 22, every registered practice", schedule: { type: "date", date: "2026-12-22" }, audience: "all", cc: true,
    eyebrow: "Before the break", title: "One question to take into the holidays",
    subject: "One question to take into the holidays",
    preheader: "Bring your answers to Session 1.2 on Saturday morning.",
    body: `Hi {{first_name}},

Before the break, one question for you and each person coming with you:

"If patients described our practice in one sentence a year from now, what would we want them to say?"

Don’t compare answers yet. Bring them to Session 1.2 on Saturday morning, where your team writes the positioning your practice will own.

Happy holidays from the Kasper and Global Academy of Dentistry team. See you on Jan 9.` },

  { id: "e06", name: "Know before you go", when: "Jan 4, every registered practice", schedule: { type: "date", date: "2027-01-04" }, audience: "all", cc: true,
    eyebrow: "Five days to go", title: "Everything for Saturday",
    subject: "Practice Leadership Summit: everything for Saturday",
    preheader: "Where, when, your table and what to bring.",
    body: `Hi {{first_name}},

Five days to go. Here’s everything {{practice}} needs:

~ Where: {{venue_name}}, {{venue_address}} · free parking
~ When: Doors and breakfast 8:00 both days. Sessions 9:00 to 5:00. Saturday reception 5:30 to 7:00.
~ Your table: {{table_no}}, already set with your Snapshot and Plan Book
~ Who’s coming: {{team_names}}
~ Bring: a laptop or tablet for your practice numbers. Nothing else.
~ CE: up to 12 AGD PACE hours, certificates on Sunday
~ Dress: business casual

Weather: if a storm makes travel unsafe, we decide by Thursday Jan 7 and move to Jan 23–24. You’ll hear from us by 6 pm that day.

See you Saturday,
The summit team` },

  { id: "e07", name: "Weather decision", when: "Only if a storm is forecast. Sent by the team from this page", schedule: { type: "broadcast" }, audience: "all", cc: true,
    eyebrow: "Weather update", title: "Weather update for Jan 9–10",
    subject: "Weather update: the summit is {{weather_decision}}",
    preheader: "Our decision for Jan 9–10.",
    body: `Hi {{first_name}},

We’ve been watching the forecast for Jan 9–10. Our decision: **{{weather_decision}}**.

If we’ve moved to Jan 23–24, your table, team and everything you’ve prepared moves with you. Prefer a full refund instead? Reply to this email by Jan 14.

The summit team` },

  { id: "e08", name: "Thank you, and one ask", when: "Jan 11, practices that checked in", schedule: { type: "date", date: "2027-01-11" }, audience: "attended",
    eyebrow: "Thank you", title: "Your 90-day plan starts now",
    subject: "Your 90-day plan, and one ask",
    preheader: "Two minutes to tell us how the weekend went.",
    body: `Hi {{first_name}},

Thank you for bringing {{practice}} to the summit. The plan your team signed on Sunday is yours to run now; the first 30 days decide most of it.

One ask: tell us how the weekend went. It takes two minutes.

[[Share your feedback|{{survey_link}}]]

We’ll confirm your Day-30 call this week. If you’d like support turning the plan into results, reply "90 days" and we’ll send details of the follow-up program.

${SIGN}` },

  { id: "e09", name: "Day 30 check-in", when: "Feb 9, practices that checked in", schedule: { type: "date", date: "2027-02-09" }, audience: "attended",
    eyebrow: "Day 30", title: "Three questions before your Day-30 call",
    subject: "Day 30: three questions before your coach call",
    preheader: "Five minutes with your team before the call.",
    body: `Hi {{first_name}},

It’s been 30 days since your team signed its plan. Before your Day-30 call, take five minutes with your team:

1. Which first-90-day milestones are on track?
2. Which one is stuck, and is the problem technical or about people?
3. What do you need that you don’t have yet?

The summit team` },

  { id: "e10", name: "Day 90 review", when: "Apr 9, practices that checked in", schedule: { type: "date", date: "2027-04-09" }, audience: "attended",
    eyebrow: "Day 90", title: "A letter from your team, written on Jan 10",
    subject: "A letter from your team, written on Jan 10",
    preheader: "Open it together, then book your Day-90 review.",
    body: `Hi {{first_name}},

Ninety days ago your team wrote a letter to your future practice. It’s in the post to you this week.

Open it together, then book your Day-90 review. We’ll look at the plan you signed, what changed, and what the next 90 days should hold.

[[Book your Day-90 review|{{review_link}}]]

Thank you for being part of the first Practice Leadership Summit. Alumni get first seats in 2028.

Kasper and Global Academy of Dentistry` },
];

export const AUDIENCES = {
  new: "Each new registration",
  prework_missing: "Practices without pre-work",
  prework_in: "Practices with pre-work",
  all: "Every registered practice",
  unpaid: "Practices that haven’t paid",
  attended: "Practices that checked in",
};
export function inAudience(audience, p, pw) {
  if (audience === "prework_missing") return !pw;
  if (audience === "prework_in") return !!pw;
  if (audience === "attended") return (p.checkedIn || []).some(Boolean);
  if (audience === "unpaid") return p.invoice !== "Paid";
  return true;
}

export function firstName(full) {
  const n = String(full || "").trim();
  if (!n) return "there";
  const parts = n.split(/\s+/);
  if (/^dr\.?$/i.test(parts[0]) && parts.length > 1) return "Dr. " + parts[parts.length - 1];
  return parts[0];
}
const money = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");

export function practiceVars(p, pw) {
  const names = [p.owner.name, ...p.members.map((m) => m.name)].filter(Boolean);
  const extra = Math.max(0, (p.people || 0) - names.length);
  return {
    first_name: firstName(p.owner.name), practice: p.name, table_no: String(p.number), ref: p.reference || "#" + p.number,
    ticket: p.ticket, price: money(p.price),
    team_names: names.join(", ") + (extra ? ` and ${extra} more` : ""),
    site_link: SITE, inbox: INBOX, prework_link: `${SITE}/?n=${p.number}#prework`,
    report_link: p.reportKey ? `${SITE}/report?k=${p.reportKey}` : "",
    call_time: (pw && pw.answers && pw.answers.callTime ? pw.answers.callTime.toLowerCase() : "a time that suits you"),
  };
}

// Builds one email for one practice. `state` holds the team's approval, edited text and vars.
// Stand-in values so previews and tests always show a complete email.
export const SAMPLE_VARS = {
  venue_name: "The Grand Hotel", venue_address: "123 Main Street, Clifton, NJ", weather_decision: "going ahead as planned",
  survey_link: SITE + "/#feedback", review_link: SITE + "/#day90", report_link: SITE + "/report?k=sample-report-link",
  call_time: "Dec 14–18, mornings", first_name: "Dr. Patel", practice: "Riverside Family Dental", table_no: "7", ref: "PLS-007",
  ticket: "Team of 3", price: "$3,400", team_names: "Dr. Maya Patel, Jordan Lee, Sam Ortiz", site_link: SITE, inbox: INBOX, prework_link: SITE + "/?n=7#prework",
};

// `opts.sample`: fill anything still blank with SAMPLE_VARS (previews and tests only, never real sends).
export function renderJourney(def, p, pw, state = {}, opts = {}) {
  const vars = { ...(state.vars || {}), ...(p ? practiceVars(p, pw) : {}) };
  const missing = new Set();
  const fill = (s) => String(s || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, k) => {
    const v = vars[k];
    if (v == null || v === "") { missing.add(k); return opts.sample && SAMPLE_VARS[k] ? SAMPLE_VARS[k] : m; }
    return String(v);
  });
  const subject = fill(state.subject || def.subject), body = fill(state.body || def.body);
  const html = layout({ title: fill(def.title), eyebrow: def.eyebrow, preheader: fill(def.preheader), body: markup(body),
    footerNote: p ? `You’re receiving this because ${p.name} registered for the summit.` : "" });
  return { subject, html, text: plain(body), missing: [...missing] };
}

// Whether a scheduled email is due for a practice right now.
export function isDue(def, p, now = Date.now()) {
  const s = def.schedule;
  if (s.type === "date") {
    const start = Date.parse(s.date + "T00:00:00-05:00");
    return now >= start && now < start + 3 * 864e5; // three-day catch-up window
  }
  if (s.type === "after") {
    const until = Date.parse(s.until + "T23:59:00-05:00");
    return now < until && Date.parse(p.createdAt) + s.days * 864e5 <= now;
  }
  return false;
}
export function nextDate(def) {
  const s = def.schedule;
  return s.type === "date" ? s.date : s.type === "after" ? "rolling" : s.type;
}
