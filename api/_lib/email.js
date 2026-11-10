// Sends email through Resend (resend.com) and renders the summit's email design.
//
//   RESEND_API_KEY   Resend API key (starts with re_)
//   EMAIL_FROM       e.g. "Practice Leadership Summit <hello@yoursummitdomain.com>" (a domain verified in Resend)
//   EMAIL_REPLY_TO   where replies go (default: the team inbox below)
//
// On the Site Serving Platform (STORE_BACKEND=ssp) mail goes through the platform mailer
// instead: see sspMail in ssp.js and ssp-mail-template.html.
//
// Without any of these nothing is sent: emails are kept in memory (and written to .outbox/
// when running locally) so they can be previewed.
import { sspOn, sspMail } from "./ssp.js";

export const INBOX = process.env.EMAIL_REPLY_TO || "Programs@amalandcompany.com";
export const SITE = (process.env.SITE_URL || "https://practice-leadership-summit.vercel.app").replace(/\/+$/, "");
const outbox = globalThis.__summitOutbox || (globalThis.__summitOutbox = []);
export const getOutbox = () => outbox;

// Two ways to send: your own mailbox (SMTP_USER + SMTP_PASS, e.g. Google Workspace with an app
// password) or Resend (RESEND_API_KEY). The mailbox wins when both are set.
const smtpOn = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
export const sender = () => sspOn() ? "the platform mailer (Site settings → Mail)" : process.env.EMAIL_FROM || (smtpOn() ? `Practice Leadership Summit <${process.env.SMTP_USER}>` : "");
export function emailReady() { return sspOn() || smtpOn() || !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM); }

// The platform wraps each message in the site's mail template and strips <head> and <style>,
// so only the body goes; ssp-mail-template.html carries the rest (paste it into Site settings → Mail).
const bodyOnly = (html) => { const m = String(html || "").match(/<body[^>]*>([\s\S]*)<\/body>/i); return m ? m[1] : String(html || ""); };
const textOf = (html) => bodyOnly(html).replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|tr|li|h\d|div)>/gi, "\n")
  .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&rarr;/g, "→").replace(/&[a-z#0-9]+;/gi, "").replace(/\n{3,}/g, "\n\n").trim();
async function platformSend({ to, cc, subject, html, text, replyTo }) {
  try {
    // The platform has no Cc: everyone goes on To (they're all from the same practice).
    await sspMail({ to: [...to, ...cc].slice(0, 20), subject: subject.slice(0, 200), text: (text || textOf(html) || subject).slice(0, 20000),
      html: bodyOnly(html).slice(0, 100000), replyTo: replyTo || INBOX });
    return { ok: true, id: "ssp-queued" };
  } catch (e) {
    return { ok: false, error: e.status === 403 ? "Mail is off for this site, or your role can’t send it (Site settings → Mail)." : e.message };
  }
}
let transport;
async function smtpSend({ to, cc, subject, html, text, replyTo }) {
  if (!transport) {
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: String(process.env.SMTP_PASS).replace(/\s+/g, "") } });
  }
  try {
    const info = await transport.sendMail({ from: sender(), to, cc: cc.length ? cc : undefined, subject, html, text, replyTo: replyTo || INBOX });
    return { ok: true, id: info.messageId };
  } catch (e) {
    console.error("SMTP error", e.message);
    return { ok: false, error: /Invalid login|535|Username and Password/i.test(e.message) ? "The mailbox login was refused. Check SMTP_USER and the app password." : e.message };
  }
}

export async function sendEmail({ to, cc, subject, html, text, replyTo, tag }) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  const ccs = (Array.isArray(cc) ? cc : cc ? [cc] : []).filter((x) => x && !list.includes(x));
  if (!list.length) return { ok: false, error: "No recipient" };
  if (sspOn()) return platformSend({ to: list, cc: ccs, subject, html, text, replyTo });
  if (!emailReady()) {
    const msg = { id: "local-" + (outbox.length + 1), to: list, cc: ccs, subject, html, text, at: new Date().toISOString(), tag };
    outbox.unshift(msg);
    if (!process.env.VERCEL && typeof window === "undefined") {
      try {
        const fs = await import("node:fs"), path = await import("node:path");
        const dir = path.join(process.cwd(), ".outbox"); fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${String(outbox.length).padStart(3, "0")}-${(tag || "email").replace(/[^a-z0-9-]/gi, "")}.html`), html);
      } catch {}
    }
    return { ok: true, id: msg.id, local: true };
  }
  if (smtpOn()) return smtpSend({ to: list, cc: ccs, subject, html, text, replyTo });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: sender(), to: list, cc: ccs.length ? ccs : undefined, subject, html, text, reply_to: replyTo || INBOX,
      tags: tag ? [{ name: "type", value: tag.replace(/[^a-zA-Z0-9_-]/g, "_") }] : undefined }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("Resend error", res.status, JSON.stringify(j)); return { ok: false, error: j.message || "Email provider error " + res.status }; }
  return { ok: true, id: j.id };
}

/* ---------------------------------------------------------------------------------------
   Design. Table layout and inline styles so it renders the same in Gmail, Outlook and Apple
   Mail. Same colours and voice as the website: deep navy, one pink accent, generous spacing.
   --------------------------------------------------------------------------------------- */
const C = { ink: "#0B1A33", ink2: "#3A4560", muted: "#5F6A84", line: "#E3E7EF", bg: "#EEF1F7", card: "#F6F8FB", accent: "#D92E66", accentText: "#B51E50", blue: "#2F5BD3" };
const FONT = "'Atkinson Hyperlegible','Segoe UI',Helvetica,Arial,sans-serif";
const DISPLAY = "'Bricolage Grotesque','Avenir Next','Segoe UI',Helvetica,Arial,sans-serif";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong style="color:' + C.ink + '">$1</strong>')
  .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:' + C.blue + ';text-decoration:underline">$1</a>')
  .replace(/(^|[\s(>])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '$1<a href="mailto:$2" style="color:' + C.blue + '">$2</a>');

export function button(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px"><tr><td style="border-radius:12px;background:${C.accent}">
<a href="${esc(url)}" style="display:inline-block;padding:14px 26px;font:700 16px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:12px">${esc(label)}&nbsp;&rarr;</a></td></tr></table>`;
}
export function facts(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;background:${C.card};border:1px solid ${C.line};border-radius:14px">
${rows.map(([k, v], i) => `<tr><td style="padding:12px 16px;${i ? "border-top:1px solid " + C.line + ";" : ""}font:700 13px/1.4 ${FONT};color:${C.muted};width:34%;vertical-align:top">${esc(k)}</td><td style="padding:12px 16px;${i ? "border-top:1px solid " + C.line + ";" : ""}font:15px/1.5 ${FONT};color:${C.ink};vertical-align:top">${inline(v)}</td></tr>`).join("")}
</table>`;
}
const P = (html) => `<p style="margin:0 0 16px;font:16px/1.65 ${FONT};color:${C.ink2}">${html}</p>`;

// Light markup used by the journey texts (the team can edit these in the console):
//   blank line = new paragraph · "1. " lines = numbered steps · "- " lines = bullets
//   "~ Label: value" lines = a details card · "[[Button label|https://…]]" = a button · **bold**
export function markup(src) {
  const blocks = String(src || "").replace(/\r/g, "").trim().split(/\n{2,}/);
  return blocks.map((b) => {
    const lines = b.split("\n").map((l) => l.trimEnd());
    const btn = b.trim().match(/^\[\[(.+?)\|(.+?)\]\]$/);
    if (btn) return button(btn[1], btn[2]);
    if (lines.every((l) => /^~\s*[^:]+:/.test(l))) return facts(lines.map((l) => { const m = l.replace(/^~\s*/, "").match(/^([^:]+):\s*(.*)$/); return [m[1], m[2]]; }));
    if (lines.every((l) => /^\d+\.\s/.test(l))) return steps(lines.map((l) => l.replace(/^\d+\.\s/, "")));
    if (lines.every((l) => /^-\s/.test(l))) return `<ul style="margin:0 0 18px;padding-left:20px;font:16px/1.65 ${FONT};color:${C.ink2}">${lines.map((l) => `<li style="margin:0 0 6px">${inline(l.slice(2))}</li>`).join("")}</ul>`;
    if (lines.length === 1 && /^".+"$/.test(lines[0])) return `<p style="margin:0 0 18px;padding:16px 20px;border-left:4px solid ${C.accent};background:${C.card};border-radius:0 12px 12px 0;font:600 18px/1.5 ${DISPLAY};color:${C.ink}">${inline(lines[0])}</p>`;
    return P(lines.map(inline).join("<br>"));
  }).join("\n");
}
export function steps(items) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">${items.map((t, i) => `<tr>
<td style="width:34px;vertical-align:top;padding:2px 0 12px"><div style="width:26px;height:26px;border-radius:13px;background:${C.ink};color:#fff;font:700 13px/26px ${FONT};text-align:center">${i + 1}</div></td>
<td style="vertical-align:top;padding:3px 0 12px;font:16px/1.6 ${FONT};color:${C.ink2}">${inline(t)}</td></tr>`).join("")}</table>`;
}
// Plain-text version from the same markup.
export function plain(src) {
  return String(src || "").replace(/\[\[(.+?)\|(.+?)\]\]/g, "$1: $2").replace(/^~\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1");
}

// The wrapper the platform puts around every email (Site settings → Mail, or the console's
// "Set up email" button): the page head and mobile styles that the platform strips from messages.
export function mailTemplateHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>{{subject}}</title>
<style>@media (max-width:620px){.px{padding-left:22px!important;padding-right:22px!important}.h1{font-size:26px!important}}a{color:${C.blue}}</style></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">{{content}}</body></html>`;
}

export function layout({ title, preheader = "", eyebrow = "", body, footerNote = "" }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title>
<style>@media (max-width:620px){.px{padding-left:22px!important;padding-right:22px!important}.h1{font-size:26px!important}}a{color:${C.blue}}</style></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="padding:0 6px 14px;font:700 14px/1 ${DISPLAY};color:${C.ink}">Kasper <span style="color:${C.accentText}">&times;</span> Global Academy of Dentistry</td></tr>
<tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${C.line}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="background:${C.ink};padding:26px 36px 24px" class="px">
    <div style="font:700 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:#F7A9C2">${esc(eyebrow || "Practice Leadership Summit")}</div>
    <div class="h1" style="margin-top:12px;font:800 30px/1.15 ${DISPLAY};color:#ffffff;letter-spacing:-.01em">${esc(title)}</div>
    <div style="margin-top:14px;font:14px/1.4 ${FONT};color:#B9C3D9">Sat Jan 9 &ndash; Sun Jan 10, 2027 &middot; North Jersey</div>
  </td></tr>
  <tr><td style="height:4px;background:${C.accent};line-height:4px;font-size:0">&nbsp;</td></tr>
  <tr><td style="padding:32px 36px 14px" class="px">${body}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:22px 10px 0;font:13px/1.6 ${FONT};color:${C.muted};text-align:center">
  ${footerNote ? esc(footerNote) + "<br>" : ""}Practice Leadership Summit &middot; hosted by Kasper in partnership with Global Academy of Dentistry<br>
  Questions? Reply to this email or write to <a href="mailto:${esc(INBOX)}" style="color:${C.muted}">${esc(INBOX)}</a> &middot; <a href="${SITE}" style="color:${C.muted}">Summit website</a>
</td></tr>
</table></td></tr></table></body></html>`;
}
