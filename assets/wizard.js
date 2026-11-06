/* Step-by-step pop-up forms for registration and pre-work.
   Questions come from assets/questions.js (generated from api/_lib/questions.js).
   app.js opens them through window.PLS_WIZ.open(name, options). */
(function () {
  "use strict";
  var Q = window.PLS_Q, $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var ROLES = ["Office manager", "Associate dentist", "Hygienist", "Dental assistant", "Treatment coordinator", "Front desk", "Other"];
  var TICKETS = { 1: "Single seat", 2: "Team of 2", 3: "Team of 3", 4: "Team of 4 or more" };
  var INBOX = window.PLS_INBOX || "Programs@amalandcompany.com";
  var DRAFT_KEY = "pls-prework-draft";

  /* ---------- rendering one question ---------- */
  var uid = 0;
  function id(k) { uid++; return "w-" + k + "-" + uid; }
  function head(q, forId, tag) {
    var t = tag || "label";
    return "<" + t + (forId && t === "label" ? ' for="' + forId + '"' : "") + ' class="qlabel">' + esc(q.label) +
      (q.hint ? ' <span class="hint">' + esc(q.hint) + "</span>" : "") + (q.req ? ' <span class="req" aria-hidden="true">required</span>' : "") + "</" + t + ">";
  }
  function why(q, show) { return show && q.why ? '<p class="why">' + esc(q.why) + "</p>" : ""; }

  function renderQ(q, showWhy) {
    var i = id(q.k), w = q.w ? " w-" + q.w : "", sh = q.showIf ? ' data-show-if="' + esc(q.showIf[0]) + "=" + esc(q.showIf[1]) + '"' : "";
    switch (q.type) {
      case "text": case "email": case "url": case "tel": case "number":
        var type = q.type === "url" ? "text" : q.type;
        var attrs = (q.max ? ' maxlength="' + q.max + '"' : "") + (q.min != null ? ' min="' + q.min + '"' : "") +
          (q.type === "number" ? ' max="' + q.max + '" step="' + (q.step || 1) + '" inputmode="decimal"' : "") +
          (q.placeholder ? ' placeholder="' + esc(q.placeholder) + '"' : "") + (q.auto ? ' autocomplete="' + q.auto + '"' : "") +
          (q.inputmode ? ' inputmode="' + q.inputmode + '"' : "") + (q.value != null ? ' value="' + q.value + '"' : "") +
          (q.type === "url" ? ' inputmode="url" autocomplete="url"' : "") + (q.type === "email" ? ' autocomplete="email"' : "");
        return '<div class="q' + w + '" data-q="' + q.k + '"' + sh + ">" + head(q, i) +
          '<input type="' + type + '" id="' + i + '" name="' + q.k + '"' + attrs + ">" + why(q, showWhy) + "</div>";
      case "textarea":
        return '<div class="q" data-q="' + q.k + '">' + head(q, i) + '<textarea id="' + i + '" name="' + q.k + '" maxlength="' + (q.max || 1500) + '" rows="3"></textarea>' + why(q, showWhy) + "</div>";
      case "select":
        return '<div class="q' + w + '" data-q="' + q.k + '">' + head(q, i) + '<select id="' + i + '" name="' + q.k + '"><option value="">Choose…</option>' +
          q.opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select>" + why(q, showWhy) + "</div>";
      case "choice": case "multi":
        var multi = q.type === "multi";
        return '<fieldset class="q" data-q="' + q.k + '"' + (q.pick ? ' data-pick="' + q.pick + '"' : "") + sh + ">" + head(q, null, "legend") +
          '<div class="tiles' + (q.opts.length > 4 ? " many" : "") + '">' + q.opts.map(function (o) {
            return '<label class="tile"><input type="' + (multi ? "checkbox" : "radio") + '" name="' + q.k + '" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>";
          }).join("") + "</div>" + why(q, showWhy) + "</fieldset>";
      case "check":
        return '<div class="q" data-q="' + q.k + '"><label class="check"><input type="checkbox" name="' + q.k + '"> <span>' + esc(q.label) +
          (q.hint ? ' <span class="hint">' + esc(q.hint) + "</span>" : "") + "</span></label></div>";
      case "pct3":
        return '<fieldset class="q" data-q="' + q.k + '">' + head(q, null, "legend") + '<div class="pct">' + q.parts.map(function (p) {
          var pi = id(p.k);
          return '<div class="pctin"><label for="' + pi + '">' + esc(p.label) + '</label><span class="sfx"><input type="number" id="' + pi + '" name="' + p.k + '" min="0" max="100" inputmode="numeric"><i>%</i></span></div>';
        }).join("") + '<p class="pcttotal" aria-live="polite"></p></div>' + why(q, showWhy) + "</fieldset>";
      case "scores":
        return '<fieldset class="q" data-q="' + q.k + '">' + head(q, null, "legend") + '<div class="scores">' + q.parts.map(function (p) {
          return '<div class="srow" role="radiogroup" aria-label="' + esc(p.label) + '"><span class="sname">' + esc(p.label) + '</span><span class="sdots">' +
            [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="radio" name="' + p.k + '" value="' + n + '"><span>' + n + "</span></label>"; }).join("") + "</span></div>";
        }).join("") + "</div>" + why(q, showWhy) + "</fieldset>";
      case "list3":
        return '<fieldset class="q" data-q="' + q.k + '">' + head(q, null, "legend") + '<ol class="list3">' + [0, 1, 2].map(function (n) {
          return '<li><input type="text" name="' + q.k + '" maxlength="' + (q.max || 200) + '" aria-label="Challenge ' + (n + 1) + '"></li>';
        }).join("") + "</ol>" + why(q, showWhy) + "</fieldset>";
      case "seats":
        return '<fieldset class="q" data-q="seats">' + head(q, null, "legend") + '<div class="tiles seats">' +
          [[1, "single seat"], [2, "owner + 1"], [3, "owner + 2"], [4, "bigger team"]].map(function (s) {
            return '<label class="tile"><input type="radio" name="seats" value="' + s[0] + '"><span><b>' + (s[0] === 4 ? "4+" : s[0]) + "</b><small>" + s[1] + "</small></span></label>";
          }).join("") + '</div><div class="extra" hidden><label for="w-extra">People beyond three</label><input type="number" id="w-extra" name="extra" min="1" max="6" value="1"></div></fieldset>';
      case "owner":
        return '<fieldset class="q" data-q="owner">' + head(q, null, "legend") + '<div class="ownergrid">' +
          '<div><label for="w-oname">Full name</label><input type="text" id="w-oname" name="ownerName" autocomplete="name" maxlength="100"></div>' +
          '<div><label for="w-oemail">Email</label><input type="email" id="w-oemail" name="ownerEmail" autocomplete="email" maxlength="120"></div>' +
          '<div><label for="w-ophone">Phone <span class="hint">optional</span></label><input type="tel" id="w-ophone" name="ownerPhone" autocomplete="tel" maxlength="40"></div></div></fieldset>';
      case "members":
        return '<fieldset class="q" data-q="members"><legend class="qlabel">' + esc(q.label) + ' <span class="hint">names now, emails for CE certificates</span></legend><div class="members"></div></fieldset>';
      case "consents":
        return '<div class="q" data-q="consents"><div class="recap" aria-live="polite"></div>' +
          '<div class="consents"><p class="qlabel">You’re happy for…</p>' +
          '<label class="check"><input type="checkbox" name="photo" checked> <span>a team photo in your Plan Book</span></label>' +
          '<label class="check"><input type="checkbox" name="kasperUpdates"> <span>Kasper to send you updates</span></label>' +
          '<label class="check"><input type="checkbox" name="gadUpdates"> <span>Global Academy of Dentistry to send you updates</span></label>' +
          '<label class="check"><input type="checkbox" name="partnerIntros"> <span>introductions to summit partners whose solutions match your plan</span></label></div>' +
          '<label class="check terms"><input type="checkbox" name="terms"> <span>We accept the terms: full refund to Dec 4, 50% to Dec 18, then a credit. Name changes are free. If snow makes travel unsafe we move to Jan 23–24 or refund in full.</span></label></div>';
    }
    return "";
  }

  function memberRow(i, prev) {
    var defaults = ["Office manager", "Hygienist", "Dental assistant"], p = prev || {};
    var role = p.role || defaults[i];
    return '<div class="member" data-i="' + i + '"><span class="mnum">' + (i + 2) + "</span>" +
      '<div><label for="w-mn' + i + '">Name</label><input type="text" id="w-mn' + i + '" data-m="name" maxlength="100" value="' + esc(p.name || "") + '"></div>' +
      '<div><label for="w-mr' + i + '">Role</label><select id="w-mr' + i + '" data-m="role">' + ROLES.map(function (r) { return "<option" + (r === role ? " selected" : "") + ">" + r + "</option>"; }).join("") + "</select></div>" +
      '<div><label for="w-me' + i + '">Email</label><input type="email" id="w-me' + i + '" data-m="email" maxlength="120" value="' + esc(p.email || "") + '"></div></div>';
  }

  /* ---------- a wizard ---------- */
  function Wizard(dialog, def, opts) {
    this.d = dialog; this.def = def; this.o = opts; this.i = 0;
    this.form = $(".wiz-body", dialog);
    this.qs = [];
    var self = this;
    def.steps.forEach(function (s) { s.questions.forEach(function (q) { self.qs.push(q); }); });
    this.form.innerHTML = def.steps.map(function (s, n) {
      return '<section class="wstep" data-step="' + n + '"' + (n ? " hidden" : "") + ' aria-labelledby="' + def.id + "-h" + n + '">' +
        '<h3 id="' + def.id + "-h" + n + '" tabindex="-1">' + esc(s.title) + '</h3><p class="intro">' + esc(s.intro) + "</p>" +
        '<div class="qs">' + s.questions.map(function (q) { return renderQ(q, opts.showWhy); }).join("") + "</div></section>";
    }).join("") + '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="pls_hp" tabindex="-1" autocomplete="new-password" data-lpignore="true" data-1p-ignore></label></div>' +
      '<p class="err" role="alert" hidden></p>';
    $(".steps", dialog).innerHTML = def.steps.map(function (s, n) { return '<li><button type="button" data-go="' + n + '">' + esc(s.title) + "</button></li>"; }).join("");
    this.err = $(".err", this.form);
    this.next = $(".next", dialog); this.back = $(".back", dialog);
    this.next.addEventListener("click", function () { self.forward(); });
    this.back.addEventListener("click", function () { self.go(self.i - 1); });
    $(".steps", dialog).addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b && +b.dataset.go < self.i) self.go(+b.dataset.go); });
    this.form.addEventListener("submit", function (e) { e.preventDefault(); self.forward(); });
    this.form.addEventListener("input", function (e) { self.showErr(""); self.onChange(e); });
    this.form.addEventListener("change", function (e) { self.onChange(e); });
    this.form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") { e.preventDefault(); self.forward(); }
    });
    if (opts.setup) opts.setup(this);
    this.go(0, true);
  }
  Wizard.prototype.step = function () { return $$(".wstep", this.form)[this.i]; };
  Wizard.prototype.go = function (n, quiet) {
    var steps = $$(".wstep", this.form), total = steps.length;
    n = Math.max(0, Math.min(total - 1, n));
    var dir = n >= this.i ? "fwd" : "bwd";
    steps.forEach(function (s, k) { s.hidden = k !== n; s.classList.remove("fwd", "bwd"); });
    if (!quiet) steps[n].classList.add(dir);
    this.i = n;
    $$(".steps li", this.d).forEach(function (li, k) { li.className = k < n ? "done" : k === n ? "now" : ""; if (k === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
    $(".count", this.d).textContent = "Step " + (n + 1) + " of " + total;
    $(".nowtitle", this.d).textContent = this.def.steps[n].title;
    $(".bar i", this.d).style.width = ((n + 1) / total * 100) + "%";
    this.back.hidden = n === 0;
    this.next.textContent = n === total - 1 ? this.o.submitLabel : "Continue";
    this.showErr("");
    $(".wiz-scroll", this.d).scrollTop = 0;
    if (!quiet) { var h = $("h3", steps[n]); setTimeout(function () { h.focus({ preventScroll: true }); }, 20); }
    if (this.o.onStep) this.o.onStep(this, n);
  };
  Wizard.prototype.showErr = function (m) { this.err.textContent = m; this.err.hidden = !m; };
  Wizard.prototype.val = function (k) {
    var els = $$('[name="' + k + '"]', this.form);
    if (!els.length) return undefined;
    if (els[0].type === "radio") { var c = els.filter(function (e) { return e.checked; })[0]; return c ? c.value : ""; }
    if (els[0].type === "checkbox") return els.length > 1 || els[0].closest(".tiles") ? els.filter(function (e) { return e.checked; }).map(function (e) { return e.value; }) : els[0].checked;
    if (els.length > 1) return els.map(function (e) { return e.value.trim(); });
    return els[0].value.trim();
  };
  Wizard.prototype.values = function () {
    var self = this, out = {};
    this.qs.forEach(function (q) {
      if (q.parts) q.parts.forEach(function (p) { var v = self.val(p.k); out[p.k] = v === "" ? null : v; });
      else if (["seats", "owner", "members", "consents"].indexOf(q.type) < 0) out[q.k] = self.val(q.k);
    });
    out.hp = this.val("pls_hp");
    return out;
  };
  Wizard.prototype.onChange = function (e) {
    var self = this, t = e.target;
    // conditional questions
    $$("[data-show-if]", this.form).forEach(function (el) { var c = el.dataset.showIf.split("="); el.hidden = self.val(c[0]) !== c[1]; });
    // pick limits on multi-choice
    var box = t.closest && t.closest("[data-pick]");
    if (box) { var max = +box.dataset.pick, boxes = $$("input", box), on = boxes.filter(function (b) { return b.checked; }).length; boxes.forEach(function (b) { b.disabled = !b.checked && on >= max; }); }
    if (this.o.onChange) this.o.onChange(this, e);
  };
  Wizard.prototype.check = function () {
    var self = this, step = this.def.steps[this.i], missing = [];
    step.questions.forEach(function (q) {
      var el = $('[data-q="' + q.k + '"]', self.form);
      if (el && el.hidden) return;
      if (q.type === "email" && self.val(q.k) && !EMAIL.test(self.val(q.k))) missing.push("a valid " + q.label.toLowerCase());
      if (!q.req) return;
      var v = self.val(q.k);
      if (q.type === "list3") { if (!v.some(Boolean)) missing.push("at least one challenge"); return; }
      if (q.type === "email") { if (!EMAIL.test(v || "")) missing.push(q.label.toLowerCase()); return; }
      if (["seats", "owner", "members", "consents"].indexOf(q.type) >= 0) return;
      if (!v || (Array.isArray(v) && !v.length)) missing.push(q.label.replace(/\?$/, "").toLowerCase());
    });
    if (this.o.check) missing = missing.concat(this.o.check(this, step.id));
    if (missing.length) { this.showErr("Please add " + missing.join(", ") + "."); return false; }
    return true;
  };
  Wizard.prototype.forward = function () {
    if (this.busy || !this.check()) return;
    if (this.i < this.def.steps.length - 1) return this.go(this.i + 1);
    this.submit();
  };
  Wizard.prototype.submit = function () {
    var self = this, body = this.o.collect(this);
    this.busy = true; this.next.disabled = true; var label = this.next.textContent; this.next.textContent = "Saving…";
    post(this.o.url, body).then(function (j) { self.o.done(self, j, body); })
      .catch(function (x) { self.showErr(x.message); })
      .then(function () { self.busy = false; self.next.disabled = false; self.next.textContent = label; });
  };
  Wizard.prototype.reset = function () { this.form.reset(); $(".wiz-main", this.d).classList.remove("finished"); $(".wiz-done", this.d).hidden = true; this.form.hidden = false; $(".wiz-foot", this.d).hidden = false; this.go(0, true); this.onChange({ target: this.form }); };
  Wizard.prototype.finish = function () { $(".count", this.d).textContent = "Done"; this.form.hidden = true; $(".wiz-foot", this.d).hidden = true; $(".wiz-main", this.d).classList.add("finished"); var dn = $(".wiz-done", this.d); dn.hidden = false; $(".wiz-scroll", this.d).scrollTop = 0; dn.focus(); };

  // Posts a form. Retries once on a dropped connection or a reply that isn't ours.
  function post(url, body, retried) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          if (j && j.ok) return j;
          if (j && j.error) throw Object.assign(new Error(j.error), { final: true });
          throw new Error("The server answered with code " + r.status + ".");
        });
      }, function () { throw new Error("We couldn't reach the server. Check your internet connection."); })
      .catch(function (x) {
        if (x.final) throw x;
        if (!retried) return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () { return post(url, body, true); });
        throw new Error(x.message + " Your answers are still here, so please try again, or email " + INBOX + ".");
      });
  }

  /* ---------- registration ---------- */
  function seatCount(w) { var s = +w.val("seats") || 3; return s === 4 ? 3 + Math.max(1, Math.min(6, +$("#w-extra", w.form).value || 1)) : s; }
  function members(w) {
    return $$(".member", w.form).filter(function (m) { return !m.hidden; }).map(function (m) {
      return { name: $("[data-m=name]", m).value.trim(), role: $("[data-m=role]", m).value, email: $("[data-m=email]", m).value.trim() };
    });
  }
  function syncMembers(w) {
    var s = +w.val("seats") || 3, want = Math.min(3, (s === 4 ? 4 : s) - 1), box = $(".members", w.form);
    var have = $$(".member", box).length;
    for (var i = have; i < want; i++) box.insertAdjacentHTML("beforeend", memberRow(i));
    $$(".member", box).forEach(function (m, k) { m.hidden = k >= want; });
    $('[data-q="members"]', w.form).hidden = want === 0;
    $(".extra", w.form).hidden = s !== 4;
    if (s === 4) $('[data-q="members"] .hint', w.form).textContent = "up to three here; send extra names to " + INBOX;
    else $('[data-q="members"] .hint', w.form).textContent = "names now, emails for CE certificates";
  }
  function drawTable(w) {
    var n = seatCount(w), named = [w.val("ownerName")].concat(members(w).map(function (m) { return m.name; }));
    var shown = Math.min(n, 8), svg = '<circle cx="60" cy="60" r="30" class="tb"/>';
    for (var k = 0; k < shown; k++) {
      var a = (k / shown) * 2 * Math.PI - Math.PI / 2;
      svg += '<circle cx="' + (60 + Math.cos(a) * 46).toFixed(1) + '" cy="' + (60 + Math.sin(a) * 46).toFixed(1) + '" r="9" class="' + (named[k] ? "on" : "") + '"/>';
    }
    $(".tcard svg", w.d).innerHTML = svg;
    var name = w.val("practice");
    $(".tname", w.d).textContent = name || "Your practice";
    $(".tname", w.d).classList.toggle("empty", !name);
    var p = window.PLS_PRICE(n, w.val("kasper") === true), tk = TICKETS[+w.val("seats") || 3];
    $(".tticket", w.d).textContent = tk + " · " + n + (n === 1 ? " person" : " people");
    $(".tprice", w.d).textContent = money(p.total);
    $(".tbonus", w.d).textContent = p.bonus || "";
    $(".mini", w.d).textContent = (name ? name + " · " : "") + tk + " · " + money(p.total);
    return p;
  }
  function recap(w) {
    var p = drawTable(w), n = seatCount(w), ms = members(w).filter(function (m) { return m.name; });
    var people = [esc(w.val("ownerName")) + " <span>owner</span>"].concat(ms.map(function (m) { return esc(m.name) + " <span>" + esc(m.role.toLowerCase()) + "</span>"; }));
    $(".recap", w.form).innerHTML = '<div class="rtop"><div><b>' + esc(w.val("practice")) + "</b><span>" + esc(w.val("town")) + " · " + esc(w.val("type")) + '</span></div><div class="rprice">' + money(p.total) + "<span>" + esc(TICKETS[+w.val("seats") || 3]) + " · " + n + " people</span></div></div>" +
      '<ul class="rpeople">' + people.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      (p.bonus ? '<p class="rbonus">' + esc(p.bonus) + "</p>" : "") + '<p class="fine">We invoice ' + esc(w.val("invoiceEmail") || w.val("ownerEmail")) + " within two business days.</p>";
  }

  var reg = null, pre = null;
  function setupRegister() {
    reg = new Wizard($("#dlg-register"), Q.REGISTRATION, {
      url: "/api/register", submitLabel: "Claim our table", showWhy: false,
      setup: function (w) { $('[name="seats"][value="3"]', w.form).checked = true; syncMembers(w); drawTable(w); },
      onChange: function (w, e) { if (e.target && (e.target.name === "seats" || e.target.name === "extra")) syncMembers(w); drawTable(w); },
      onStep: function (w, n) { if (w.def.steps[n].id === "confirm") recap(w); },
      check: function (w, stepId) {
        var m = [];
        if (stepId === "team") {
          if (!w.val("ownerName")) m.push("the owner’s name");
          if (!EMAIL.test(w.val("ownerEmail"))) m.push("a valid owner email");
          members(w).forEach(function (x, k) { if (x.email && !EMAIL.test(x.email)) m.push("a valid email for team member " + (k + 2)); });
        }
        if (stepId === "confirm" && !w.val("terms")) m.push("your acceptance of the terms");
        return m;
      },
      collect: function (w) {
        var s = +w.val("seats") || 3;
        return {
          practice: w.val("practice"), town: w.val("town"), type: w.val("type"), website: w.val("website"),
          ticket: TICKETS[s], extra: s === 4 ? Math.max(1, +$("#w-extra", w.form).value || 1) : 0, kasper: w.val("kasper") === true,
          ownerName: w.val("ownerName"), ownerEmail: w.val("ownerEmail"), ownerPhone: w.val("ownerPhone"), members: members(w).filter(function (m) { return m.name; }),
          invoiceEmail: w.val("invoiceEmail"), hotel: w.val("hotel"), diet: w.val("diet"), access: w.val("access"),
          heard: w.val("heard") || "Other", referredBy: w.val("referredBy"),
          photo: w.val("photo"), kasperUpdates: w.val("kasperUpdates"), gadUpdates: w.val("gadUpdates"), partnerIntros: w.val("partnerIntros"),
          terms: w.val("terms"), hp: w.val("pls_hp")
        };
      },
      done: function (w, j, body) {
        $("#reg-ref").textContent = j.reference || ("#" + j.number);
        $("#reg-email").textContent = body.ownerEmail;
        w.lastReg = { number: j.number, practice: body.practice, email: body.ownerEmail };
        w.finish();
        if (window.PLS_ON_REGISTERED) window.PLS_ON_REGISTERED();
      }
    });
  }

  /* ---------- pre-work ---------- */
  function reportProgress(w) {
    var sections = {}, R = Q.REPORT_SECTIONS;
    w.qs.forEach(function (q) {
      var answered;
      if (q.parts) answered = q.parts.some(function (p) { var v = w.val(p.k); return v !== "" && v != null; });
      else { var v = w.val(q.k); answered = Array.isArray(v) ? v.some(Boolean) : !!v && v !== false; }
      (q.feeds || []).forEach(function (f) { if (f === "ops") return; sections[f] = sections[f] || { n: 0, a: 0 }; sections[f].n++; if (answered) sections[f].a++; });
    });
    var order = ["profile", "patients", "finances", "team", "technology", "market", "selfview", "positioning", "direction", "priorities", "readiness", "plan"];
    $(".report", w.d).innerHTML = order.filter(function (k) { return sections[k]; }).map(function (k) {
      var s = sections[k], pct = s.a / s.n;
      return '<li class="' + (pct === 1 ? "full" : pct > 0 ? "part" : "") + '"><i style="--p:' + pct + '"></i>' + esc(R[k].replace("Scorecard · ", "")) + "</li>";
    }).join("");
  }
  function pctTotal(w) {
    var el = $(".pcttotal", w.form); if (!el) return;
    var parts = $$(".pct input", w.form).map(function (i) { return i.value === "" ? null : +i.value; });
    if (parts.every(function (v) { return v === null; })) { el.textContent = ""; return; }
    var t = parts.reduce(function (a, b) { return a + (b || 0); }, 0);
    el.textContent = "Total " + t + "%"; el.className = "pcttotal" + (Math.abs(t - 100) <= 5 ? " ok" : "");
  }
  function saveDraft(w) {
    try { var v = w.values(); delete v.hp; localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch (e) {}
  }
  function loadDraft(w) {
    var v; try { v = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { v = null; }
    if (!v) return;
    Object.keys(v).forEach(function (k) {
      var val = v[k], els = $$('[name="' + k + '"]', w.form);
      if (!els.length || val == null) return;
      if (els[0].type === "radio") els.forEach(function (e) { e.checked = e.value === String(val); });
      else if (els[0].type === "checkbox") els.forEach(function (e) { e.checked = Array.isArray(val) && val.indexOf(e.value) >= 0; });
      else if (els.length > 1 && Array.isArray(val)) els.forEach(function (e, i) { e.value = val[i] || ""; });
      else els[0].value = val;
    });
  }
  function setupPrework() {
    pre = new Wizard($("#dlg-prework"), Q.PREWORK, {
      url: "/api/prework", submitLabel: "Send our pre-work", showWhy: true,
      setup: function (w) { loadDraft(w); w.onChange({ target: w.form }); },
      onChange: function (w) { pctTotal(w); reportProgress(w); saveDraft(w); },
      onStep: function (w) { reportProgress(w); },
      collect: function (w) { return w.values(); },
      done: function (w) { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} w.finish(); }
    });
  }

  window.PLS_WIZ = {
    open: function (name, o) {
      if (name === "register") {
        if (!reg) setupRegister();
        if (o && o.fresh !== false && $(".wiz-main", reg.d).classList.contains("finished")) reg.reset();
        if (o && o.team && reg.i === 0) {
          $$('[name="seats"]', reg.form).forEach(function (r) { r.checked = +r.value === o.team; });
          $("#w-extra", reg.form).value = o.extra || 1;
          $('[name="kasper"]', reg.form).checked = !!o.kasper;
          syncMembers(reg); drawTable(reg);
        }
      }
      if (name === "prework") {
        if (!pre) setupPrework();
        if ($(".wiz-main", pre.d).classList.contains("finished")) pre.reset();
        var last = reg && reg.lastReg;
        if (last) {
          $('[name="number"]', pre.form).value = last.number || "";
          $('[name="practice"]', pre.form).value = last.practice || "";
          $('[name="email"]', pre.form).value = last.email || "";
          pre.onChange({ target: pre.form });
        }
      }
    },
    focusStep: function (name) { var w = name === "register" ? reg : pre; if (w) { var h = $("h3", w.step()); h && h.focus({ preventScroll: true }); } }
  };
})();
