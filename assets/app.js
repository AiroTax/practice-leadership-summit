/* Practice Leadership Summit 2027 — site behaviour.
   Settings the team may change are at the top. */
(function () {
  "use strict";

  /* ---------- settings ---------- */
  var INBOX = "[summit inbox — to confirm]";          // shown in the footer
  var DOORS = Date.parse("2027-01-09T08:00:00-05:00");
  var EARLY_END = Date.parse("2026-12-05T00:00:00-05:00");
  var TOTAL_TABLES = 35;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  $("#inbox3").textContent = INBOX;

  /* ---------- countdown ---------- */
  function tick() {
    var now = Date.now(), d = Math.max(0, DOORS - now);
    $("#cd-d").textContent = Math.floor(d / 864e5);
    $("#cd-h").textContent = Math.floor(d / 36e5) % 24;
    $("#cd-m").textContent = Math.floor(d / 6e4) % 60;
    $("#cd-eb").textContent = Math.max(0, Math.ceil((EARLY_END - now) / 864e5));
  }
  tick(); setInterval(tick, 30000);

  /* ---------- live floor plan ---------- */
  function drawFloor(claimed) {
    claimed = Math.max(0, Math.min(TOTAL_TABLES, claimed || 0));
    $("#tables-left").textContent = (TOTAL_TABLES - claimed) + " of " + TOTAL_TABLES + " tables open";
    var html = "", n = 0;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 7; c++) {
      n++;
      var cx = 55 + c * 98, cy = 48 + r * 84, taken = n <= claimed, coach = (c === 2 || c === 5) && r % 2 === 0;
      for (var s = 0; s < 4; s++) {
        var a = (s * 90 - 45) * Math.PI / 180;
        html += '<circle class="seat" style="animation-delay:' + (n * 18 + s * 30) + 'ms" cx="' + (cx + Math.cos(a) * 30).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 30).toFixed(1) + '" r="7" fill="' + (taken ? "#FFC2D5" : "#54689A") + '"/>';
      }
      html += '<circle cx="' + cx + '" cy="' + cy + '" r="21" fill="' + (taken ? "#FF5C8F" : "#2E4372") + '" stroke="' + (coach ? "#A99BFF" : "none") + '" stroke-width="3"/>';
      html += '<text x="' + cx + '" y="' + (cy + 4.5) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#F2F4FA">' + (n < 10 ? "0" : "") + n + "</text>";
    }
    $("#floorplan").innerHTML = html;
  }
  drawFloor(0);
  function loadStats() {
    fetch("/api/stats").then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && typeof j.claimed === "number") drawFloor(j.claimed); })
      .catch(function () {});
  }
  loadStats();

  /* ---------- agenda tabs ---------- */
  var t1 = $("#tab-d1"), t2 = $("#tab-d2");
  function showDay(two) { t1.setAttribute("aria-selected", !two); t2.setAttribute("aria-selected", two); $("#day1").hidden = two; $("#day2").hidden = !two; }
  t1.addEventListener("click", function () { showDay(false); });
  t2.addEventListener("click", function () { showDay(true); });

  /* ---------- pricing (same ladder as the Airtable Price formula) ---------- */
  var TICKETS = { 1: "Single seat", 2: "Team of 2", 3: "Team of 3", 4: "Team of 4 or more" };
  function price(nPeople, kasper) {
    var early = Date.now() < EARLY_END, lines = [];
    var core = Math.min(nPeople, 3), extra = Math.max(0, nPeople - 3);
    var base = { 1: [2100, 2500], 2: [2700, 3100], 3: [3400, 3800] }[core][early ? 0 : 1];
    var label = (core === 1 ? "Single seat" : "Team of " + core) + (early ? " · early bird" : " · standard");
    if (kasper && core === 3 && 3040 < base) { base = 3040; label = "Team of 3 · Kasper customer rate"; }
    lines.push([label, base]);
    if (extra) lines.push([extra + " additional " + (extra === 1 ? "person" : "people") + " × $600", extra * 600]);
    var bonus = core === 3 ? (early ? "Qualifies for the early-bird WinDSO bonus (first 15 teams of three)" : "Qualifies for the full-team WinDSO bonus while 20 tickets last") : "";
    return { early: early, total: base + extra * 600, lines: lines, bonus: bonus };
  }

  // price-builder state (team: 1, 2, 3 or 4 = "4 or more")
  var sel = { team: 3, extra: 1, kasper: false };
  function people(s) { return s.team === 4 ? 3 + Math.max(1, Math.min(6, s.extra || 1)) : s.team; }

  function renderBuilder() {
    var n = people(sel), p = price(n, sel.kasper);
    $$("#teamseg button").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.n === sel.team); });
    $("#extrawrap").hidden = sel.team !== 4;
    $("#pricetag").textContent = p.early ? "Early bird · ends Dec 4" : "Standard price";
    $("#ptotal").textContent = money(p.total);
    $("#pper").textContent = money(p.total / n) + " per person · " + n + (n === 1 ? " person" : " people");
    $("#plines").innerHTML = p.lines.map(function (l) { return "<div><span>" + l[0] + "</span><span>" + money(l[1]) + "</span></div>"; }).join("");
    var b = $("#pbonus"); b.className = p.bonus ? "bonus" : "bonus none";
    b.textContent = p.bonus || "Add a third person to qualify for a WinDSO ticket";
    $("#regsel").textContent = TICKETS[sel.team] + " · " + money(p.total);
    $("#regsel2").textContent = (p.bonus ? p.bonus + ". " : "") + "Change it in the price builder above.";
  }
  $$("#teamseg button").forEach(function (btn) { btn.addEventListener("click", function () { sel.team = +btn.dataset.n; renderBuilder(); }); });
  $("#extra").addEventListener("input", function () { sel.extra = +this.value || 1; renderBuilder(); });
  $("#kasper").addEventListener("change", function () { sel.kasper = this.checked; renderBuilder(); });
  renderBuilder();

  /* ---------- modal plumbing ---------- */
  var dialogs = { register: $("#dlg-register"), prework: $("#dlg-prework") };
  var lastTrigger = null;
  function openModal(name, trigger) {
    var d = dialogs[name]; if (!d) return;
    lastTrigger = trigger || null;
    Object.keys(dialogs).forEach(function (k) { if (k !== name && dialogs[k].open) dialogs[k].close(); });
    if (name === "register") prepareRegister();
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    document.body.classList.add("modal-open");
    var first = d.querySelector(".modal-body:not([hidden]) input:not([type=hidden]):not([tabindex='-1']), .modal-body:not([hidden]) select");
    if (first) setTimeout(function () { first.focus(); }, 30);
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  }
  function closeModal(d) {
    if (d.open) d.close();
  }
  Object.keys(dialogs).forEach(function (k) {
    var d = dialogs[k];
    d.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
    d.addEventListener("click", function (e) {           // click on the backdrop closes
      if (e.target === d) closeModal(d);
      if (e.target.closest("[data-close]")) closeModal(d);
    });
  });
  $$("[data-open]").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.dataset.open, b); });
  });
  if (location.hash === "#register" || location.hash === "#prework") {
    setTimeout(function () { openModal(location.hash.slice(1)); }, 300);
  }

  /* ---------- registration form ---------- */
  var ROLES = ["Office manager", "Associate dentist", "Hygienist", "Dental assistant", "Treatment coordinator", "Front desk", "Other"];
  var regForm = $("#regform");
  var TICKET_TO_TEAM = { "Single seat": 1, "Team of 2": 2, "Team of 3": 3, "Team of 4 or more": 4 };

  function memberRow(i) {
    var defaults = ["Office manager", "Hygienist", "Dental assistant"];
    return '<p class="memberhead">Team member ' + (i + 2) + '</p><div class="member">' +
      '<div class="fld"><label for="m-name-' + i + '">Full name</label><input type="text" id="m-name-' + i + '" data-m="name" maxlength="100"></div>' +
      '<div class="fld"><label for="m-role-' + i + '">Role</label><select id="m-role-' + i + '" data-m="role">' +
      ROLES.map(function (r) { return "<option" + (r === defaults[i] ? " selected" : "") + ">" + r + "</option>"; }).join("") + "</select></div>" +
      '<div class="fld"><label for="m-email-' + i + '">Email</label><input type="email" id="m-email-' + i + '" data-m="email" maxlength="120"></div></div>';
  }
  function syncMembers() {
    var team = TICKET_TO_TEAM[$("#r-ticket").value] || 3;
    var want = Math.min(3, (team === 4 ? 4 : team) - 1);   // the form collects up to 3 people besides the owner
    var box = $("#r-members"), have = $$(".member", box).length;
    for (var i = have; i < want; i++) { var w = document.createElement("div"); w.className = "mwrap"; w.innerHTML = memberRow(i); box.appendChild(w); }
    $$(".mwrap", box).forEach(function (w, idx) { w.hidden = idx >= want; });
    $("#r-extra-wrap").hidden = team !== 4;
  }
  function regSummary() {
    var team = TICKET_TO_TEAM[$("#r-ticket").value] || 3;
    var n = team === 4 ? 3 + Math.max(1, Math.min(6, +$("#r-extra").value || 1)) : team;
    var p = price(n, $("#r-kasper").checked);
    $("#reg-sum-ticket").textContent = $("#r-ticket").value + " · " + n + (n === 1 ? " person" : " people");
    $("#reg-sum-price").textContent = money(p.total);
    $("#reg-sum-bonus").textContent = p.bonus;
  }
  function prepareRegister() {
    $("#reg-done").hidden = true; regForm.hidden = false;
    $("#r-ticket").value = TICKETS[sel.team];
    $("#r-extra").value = sel.extra || 1;
    $("#r-kasper").checked = sel.kasper;
    syncMembers(); regSummary();
  }
  $("#r-ticket").addEventListener("change", function () { syncMembers(); regSummary(); });
  $("#r-extra").addEventListener("input", regSummary);
  $("#r-kasper").addEventListener("change", regSummary);
  $("#r-heard").addEventListener("change", function () { $("#r-ref-wrap").hidden = this.value.indexOf("referral") < 0; });

  function showErr(el, msg) { el.textContent = msg; el.hidden = !msg; if (msg) el.scrollIntoView({ block: "nearest" }); }
  function busy(btn, on, label) { btn.disabled = on; if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; } else if (btn.dataset.label) btn.textContent = btn.dataset.label; }
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || "Something went wrong. Please try again."); return j; }); });
  }

  regForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = regForm.elements, err = $("#reg-err"), missing = [];
    if (!f.practice.value.trim()) missing.push("practice name");
    if (!f.town.value.trim()) missing.push("town");
    if (!f.type.value) missing.push("practice type");
    if (!f.ownerName.value.trim()) missing.push("owner’s name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.ownerEmail.value.trim())) missing.push("a valid owner email");
    if (!f.terms.checked) missing.push("acceptance of the terms");
    if (missing.length) return showErr(err, "Please add " + missing.join(", ") + ".");
    showErr(err, "");
    var members = $$("#r-members .mwrap").filter(function (w) { return !w.hidden; }).map(function (w) {
      return { name: $("[data-m=name]", w).value.trim(), role: $("[data-m=role]", w).value, email: $("[data-m=email]", w).value.trim() };
    }).filter(function (m) { return m.name; });
    var body = {
      practice: f.practice.value.trim(), town: f.town.value.trim(), type: f.type.value, ticket: f.ticket.value,
      extra: f.ticket.value === "Team of 4 or more" ? Math.max(1, +f.extra.value || 1) : 0, kasper: f.kasper.checked,
      ownerName: f.ownerName.value.trim(), ownerEmail: f.ownerEmail.value.trim(), ownerPhone: f.ownerPhone.value.trim(),
      members: members, heard: f.heard.value, referredBy: f.referredBy.value.trim(), diet: f.diet.value.trim(), access: f.access.value.trim(),
      photo: f.photo.checked, kasperUpdates: f.kasperUpdates.checked, gadUpdates: f.gadUpdates.checked, partnerIntros: f.partnerIntros.checked,
      terms: f.terms.checked, website: f.website.value
    };
    var btn = $("#reg-submit"); busy(btn, true, "Saving…");
    post("/api/register", body).then(function (j) {
      $("#reg-ref").textContent = j.reference || ("#" + j.number);
      $("#reg-email").textContent = body.ownerEmail;
      regForm.hidden = true; $("#reg-done").hidden = false; $("#reg-done").focus();
      $("#p-num").value = j.number || ""; $("#p-practice").value = body.practice; $("#p-email").value = body.ownerEmail;
      regForm.reset(); loadStats();
    }).catch(function (x) { showErr(err, x.message); })
      .then(function () { busy(btn, false); });
  });
  regForm.addEventListener("input", function () { showErr($("#reg-err"), ""); });
  $("#reg-to-prework").addEventListener("click", function () { openModal("prework", lastTrigger); });

  /* ---------- pre-work form ---------- */
  var preForm = $("#preform");
  preForm.addEventListener("input", function () { showErr($("#pw-err"), ""); });
  dialogs.prework.addEventListener("close", function () { $("#pw-done").hidden = true; preForm.hidden = false; });
  preForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = preForm.elements, err = $("#pw-err");
    var num = parseInt(String(f.number.value).replace(/[^0-9]/g, ""), 10);
    if (!num) return showErr(err, "Please add your registration number from the confirmation email.");
    if (!f.practice.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()) || !f.challenges.value.trim())
      return showErr(err, "Please add your practice name, a valid email and your top three challenges.");
    showErr(err, "");
    var nOrNull = function (v) { return v === "" ? null : +v; };
    var body = {
      number: num, practice: f.practice.value.trim(), email: f.email.value.trim(),
      years: nOrNull(f.years.value), locations: nOrNull(f.locations.value), teamSize: nOrNull(f.teamSize.value), newPatients: nOrNull(f.newPatients.value),
      payerMix: f.payerMix.value.trim(), production: f.production.value, technology: f.technology.value.trim(), compared: f.compared.value.trim(),
      challenges: f.challenges.value.trim(), goodWeekend: f.goodWeekend.value.trim(), callTime: f.callTime.value, website: f.website.value
    };
    var btn = $("#pw-submit"); busy(btn, true, "Sending…");
    post("/api/prework", body).then(function () {
      preForm.hidden = true; $("#pw-done").hidden = false; $("#pw-done").focus(); preForm.reset();
    }).catch(function (x) { showErr(err, x.message); })
      .then(function () { busy(btn, false); });
  });
})();
