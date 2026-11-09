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
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- countdown ---------- */
  function setNum(el, v) {
    v = String(v); if (el.textContent === v) return;
    var first = el.textContent === "—"; el.textContent = v;
    if (!first) { el.classList.remove("rolled"); void el.offsetWidth; el.classList.add("rolled"); }
  }
  function tick() {
    var now = Date.now(), d = Math.max(0, DOORS - now);
    setNum($("#cd-d"), Math.floor(d / 864e5));
    setNum($("#cd-h"), Math.floor(d / 36e5) % 24);
    setNum($("#cd-eb"), Math.max(0, Math.ceil((EARLY_END - now) / 864e5)));
  }
  tick(); setInterval(tick, 15000);

  /* ---------- live floor plan ---------- */
  function drawFloor(claimed) {
    claimed = Math.max(0, Math.min(TOTAL_TABLES, claimed || 0));
    $("#tables-left").textContent = (TOTAL_TABLES - claimed) + " of " + TOTAL_TABLES + " tables open";
    var html = "", n = 0;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 7; c++) {
      n++;
      var cx = 55 + c * 98, cy = 48 + r * 84, taken = n <= claimed, coach = (c === 2 || c === 5) && r % 2 === 0, num = (n < 10 ? "0" : "") + n;
      html += '<g class="tbl' + (taken ? " taken" : "") + '" data-n="' + num + '" tabindex="' + (taken ? -1 : 0) + '" role="button" aria-label="Table ' + num + (taken ? ", claimed" : ", open. Claim it") + '">';
      for (var s2 = 0; s2 < 4; s2++) {
        var a = (s2 * 90 - 45) * Math.PI / 180;
        html += '<circle class="seat" style="animation-delay:' + (n * 18 + s2 * 30) + 'ms" cx="' + (cx + Math.cos(a) * 30).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 30).toFixed(1) + '" r="7"/>';
      }
      html += '<circle class="top" cx="' + cx + '" cy="' + cy + '" r="21"' + (coach ? ' stroke="#A99BFF" stroke-width="3"' : "") + '/>';
      html += '<text x="' + cx + '" y="' + (cy + 4.5) + '" text-anchor="middle">' + num + "</text></g>";
    }
    $("#floorplan").innerHTML = html;
  }
  var tip = $("#floortip");
  function showTip(g) {
    if (!g) { tip.classList.remove("show"); return; }
    var box = $(".floor").getBoundingClientRect(), gb = g.getBoundingClientRect();
    tip.innerHTML = "<b>Table " + g.dataset.n + "</b>" + (g.classList.contains("taken") ? "Claimed" : "Open · click to claim it");
    tip.style.left = (gb.left - box.left + gb.width / 2) + "px"; tip.style.top = (gb.top - box.top - 6) + "px"; tip.hidden = false; tip.classList.add("show");
  }
  $("#floorplan").addEventListener("mouseover", function (e) { showTip(e.target.closest(".tbl")); });
  $("#floorplan").addEventListener("mouseleave", function () { showTip(null); });
  $("#floorplan").addEventListener("focusin", function (e) { showTip(e.target.closest(".tbl")); });
  $("#floorplan").addEventListener("focusout", function () { showTip(null); });
  function claim(g) {
    if (!g || g.classList.contains("taken")) return;
    g.classList.add("picked"); showTip(null);
    setTimeout(function () { g.classList.remove("picked"); openModal("register", g); }, reduce ? 0 : 180);
  }
  $("#floorplan").addEventListener("click", function (e) { claim(e.target.closest(".tbl")); });
  $("#floorplan").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); claim(e.target.closest(".tbl")); } });
  drawFloor(0);
  function loadStats() {
    fetch("/api/stats").then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && typeof j.claimed === "number") drawFloor(j.claimed); })
      .catch(function () {});
  }
  loadStats();

  function navH() { var n = $(".nav"); if (n) document.documentElement.style.setProperty("--navh", n.offsetHeight + "px"); }
  navH(); window.addEventListener("resize", navH);

  /* ---------- the weekend: one screen, the Plan Book turns to the chosen session's page ---------- */
  var SESS = [
    ["Opening keynote, then an honest baseline. Your team scores itself on patients, team, technology, finances and market, against its own pre-work.", "Keynote speaker and facilitators. 1.5 CE hours."],
    ["Who you serve, what you’re known for and why patients choose you. You write the position your practice will own, then test it on the next table.", "Facilitators. 1.5 CE hours."],
    ["Four areas of focus carry your positioning: operate with excellence, patient experience, technology and innovation, and staff development. Your team picks what to change in each.", "Facilitators. 1.5 CE hours."],
    ["Adaptive leadership for practice leaders: tell technical problems from adaptive ones, read how your team reacts to change, and practise the conversations that move people.", "Omar Awad, Harvard Kennedy School negotiation faculty. 1.5 CE hours."],
    ["Second keynote, then each practice measures the distance between today and its positioning, area by area, and names the real problems in the way.", "Keynote speaker and facilitators. 1.5 CE hours."],
    ["Priorities set with the whole team: impact against effort, dependencies and sequence. Expert clinics on technology, patient engagement, payments and insurance.", "Facilitators and expert tables. 1.5 CE hours."],
    ["What the plan takes over six months: people to hire or develop, skills to learn, technology and capital, and what to build, buy or partner for.", "Facilitators and expert tables. 1.5 CE hours."],
    ["Your team turns the weekend into one signed plan with owners, milestones and measures. Accountability partners are assigned and your Day-30 call is booked before you leave.", "Facilitators. 1.5 CE hours."]
  ];
  var DAYNOTE = {
    1: "Breakfast from 8:00. Lunch at 12:30, with practices mixed by type. Reception at 5:30 with every practice’s positioning poster on the wall.",
    2: "Breakfast from 8:00. Lunch at 12:30, mixed by practice type. We close at 5:00 with your plan signed."
  };
  var book = $(".book"), cur = -1;
  function swap(el) { if (!el || cur < 0) return; el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
  if ($(".daytabs")) $(".daytabs").insertAdjacentHTML("afterbegin", '<span class="pill" aria-hidden="true"></span>');
  function showPage(n) {
    if (!book) return;
    n = Math.max(0, Math.min(7, n));
    if (n === cur) return;
    var dir = n > cur ? "fwd" : "back";
    cur = n; book.dataset.page = n; book.dataset.dir = dir;
    $$(".pg", book).forEach(function (pg) { var k = +pg.dataset.n; pg.classList.toggle("on", k === n); pg.classList.toggle("past", k < n); pg.classList.toggle("next", k > n); });
    $$(".tabs i", book).forEach(function (t, k) { t.classList.toggle("on", k <= n); });
    var day = n < 4 ? 1 : 2;
    $$(".daytabs [data-day]").forEach(function (b) { b.setAttribute("aria-selected", +b.dataset.day === day); });
    $(".daytabs").dataset.day = day;
    $$(".slist li").forEach(function (li) { li.hidden = +li.dataset.day !== day; });
    $$(".slist button").forEach(function (b) { var on = +b.dataset.page === n; b.classList.toggle("now", on); if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    swap($(".sdetail")); swap($("#pgcount"));
    $("#sdesc").textContent = SESS[n][0]; $("#swho").textContent = SESS[n][1]; $("#sday").textContent = DAYNOTE[day];
    $("#pgcount").textContent = "Page " + (n + 1) + " of 8";
    $$(".pgbtn").forEach(function (b) { b.disabled = (+b.dataset.step < 0 && n === 0) || (+b.dataset.step > 0 && n === 7); });
  }
  if (book) {
    book.dataset.ready = "1";
    showPage(0);
    $$(".slist button").forEach(function (b) { b.addEventListener("click", function () { showPage(+b.dataset.page); }); });
    $$(".daytabs [data-day]").forEach(function (b) { b.addEventListener("click", function () { showPage(+b.dataset.day === 1 ? 0 : 4); }); });
    $$(".pgbtn").forEach(function (b) { b.addEventListener("click", function () { showPage(cur + +b.dataset.step); }); });
    $(".weekend").addEventListener("keydown", function (e) {
      if (e.target.matches("input,textarea,select")) return;
      if (e.key === "ArrowRight") { showPage(cur + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { showPage(cur - 1); e.preventDefault(); }
    });
    var x0 = null;
    book.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    book.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) showPage(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    book.addEventListener("click", function (e) { var r = book.getBoundingClientRect(); showPage(cur + (e.clientX > r.left + r.width / 2 ? 1 : -1)); });
  }

  /* ---------- light by default, dark on request ---------- */
  var root = document.documentElement, tbtn = $("#themebtn");
  function syncTheme() { var dark = root.dataset.theme === "dark"; tbtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode"); tbtn.title = dark ? "Light mode" : "Dark mode"; }
  tbtn.addEventListener("click", function () {
    var flip = function () { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; };
    if (document.startViewTransition && !reduce) document.startViewTransition(flip); else flip();
    try { localStorage.setItem("pls-theme", root.dataset.theme); } catch (e) {}
    syncTheme();
  });
  var t2 = $("#themebtn2");
  if (t2) { t2.addEventListener("click", function () { tbtn.click(); }); }
  var _sync = syncTheme; syncTheme = function () { _sync(); if (t2) t2.textContent = root.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"; };
  syncTheme();

  /* ---------- the menu marks the section on screen ---------- */
  var navLinks = $$('.navlinks a[href^="#"]');
  if ("IntersectionObserver" in window && navLinks.length) {
    var hero = $(".hero"); if (hero && !hero.id) hero.id = "hero";
    var navIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    [hero, $("#days"), $("#price"), $("#faq")].forEach(function (el) { if (el) navIO.observe(el); });
  }

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
  function tween(el, to) {
    var from = +el.dataset.v || to; el.dataset.v = to;
    if (reduce || from === to) { el.textContent = money(to); return; }
    var t0 = performance.now();
    (function step(t) { var k = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - k, 3); el.textContent = money(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }
  function people(s) { return s.team === 4 ? 3 + Math.max(1, Math.min(6, s.extra || 1)) : s.team; }

  function renderBuilder() {
    var n = people(sel), p = price(n, sel.kasper);
    $$("#teamseg button").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.n === sel.team); });
    $("#extrawrap").hidden = sel.team !== 4;
    $("#pricetag").textContent = p.early ? "Early-bird price until Dec 4" : "Standard price";
    tween($("#ptotal"), p.total);
    $("#pper").textContent = money(p.total / n) + " per person, " + n + (n === 1 ? " person" : " people");
    $("#plines").innerHTML = p.lines.map(function (l) { return "<div><span>" + l[0] + "</span><span>" + money(l[1]) + "</span></div>"; }).join("");
    var b = $("#pbonus"); b.className = p.bonus ? "bonus" : "bonus none";
    b.textContent = p.bonus || "Add a third person to qualify for a WinDSO ticket";
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
    if (!d.open || d.classList.contains("closing")) return;
    if (reduce) { d.close(); return; }
    d.classList.add("closing");
    setTimeout(function () { d.classList.remove("closing"); d.close(); }, 180);
  }
  Object.keys(dialogs).forEach(function (k) {
    var d = dialogs[k];
    d.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
    d.addEventListener("cancel", function (e) { e.preventDefault(); closeModal(d); });   // Escape closes with the same motion
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

  /* ---------- intro video ---------- */
  var vd = $("#dlg-video"), vid = $("#introvid");
  if (vd) {
    $$("[data-video]").forEach(function (b) { b.addEventListener("click", function () { vd.showModal(); try { vid.currentTime = 0; vid.play(); } catch (e) {} }); });
    var shut = function () { try { vid.pause(); } catch (e) {} if (vd.open) vd.close(); };
    $(".vclose", vd).addEventListener("click", shut);
    vd.addEventListener("click", function (e) { if (e.target === vd) shut(); });
    vd.addEventListener("close", function () { try { vid.pause(); } catch (e) {} });
  }

  /* ---------- "i" explanations: tap to open, tap anywhere else to close ---------- */
  var tipEl = null, tipBtn = null;
  function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; } if (tipBtn) { tipBtn.setAttribute("aria-expanded", "false"); tipBtn = null; } }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-tip]");
    if (!b) { if (tipEl && !e.target.closest(".tipbox")) hideTip(); return; }
    e.preventDefault(); e.stopPropagation();
    if (tipBtn === b) { hideTip(); return; }
    hideTip(); tipBtn = b; b.setAttribute("aria-expanded", "true");
    tipEl = document.createElement("div"); tipEl.className = "tipbox"; tipEl.setAttribute("role", "tooltip"); tipEl.textContent = b.dataset.tip;
    (b.closest("dialog") || document.body).appendChild(tipEl);
    var r = b.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)), top = r.bottom + 8;
    if (top + h > innerHeight - 12) top = r.top - h - 8;
    tipEl.style.left = left + "px"; tipEl.style.top = top + "px"; tipY = scrollY;
  }, true);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && tipEl) { hideTip(); } });
  var tipY = 0; addEventListener("scroll", function () { if (tipEl && Math.abs(scrollY - tipY) > 60) hideTip(); }, true);

  /* ---------- forms (assets/wizard.js) ---------- */
  window.PLS_ON_REGISTERED = loadStats;
})();
