/* Practice Leadership Summit 2027 — site behaviour.
   Settings the team may change are at the top. */
(function () {
  "use strict";

  /* ---------- settings ---------- */
  var INBOX = "Programs@amalandcompany.com";          // shown in the footer
  var DOORS = Date.parse("2027-01-09T08:00:00-05:00");
  var EARLY_END = Date.parse("2026-12-05T00:00:00-05:00");
  var TOTAL_TABLES = 35;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.PLS_INBOX = INBOX;
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
  window.PLS_PRICE = price;
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
    if (window.PLS_WIZ) window.PLS_WIZ.open(name, name === "register" ? { team: sel.team, extra: sel.extra, kasper: sel.kasper } : null);
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    document.body.classList.add("modal-open");
    var first = d.querySelector(".wstep:not([hidden]) input:not([tabindex='-1']), .wstep:not([hidden]) select");
    if (first) setTimeout(function () { first.focus(); }, 60);
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

  /* ---------- forms (assets/wizard.js) ---------- */
  window.PLS_ON_REGISTERED = loadStats;
})();
