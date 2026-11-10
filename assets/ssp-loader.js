// Lets the same pages run on Vercel and on the Site Serving Platform (SSP).
// On Vercel the site's /api/* calls go to the serverless functions as before. On SSP there are
// no server functions, so calls to /api/* are answered in the browser by /assets/ssp-bridge.js,
// which talks to the platform's own database, sign-in and mail under /_ssp/*.
// Load this first, as a plain script in <head>, before any page script calls fetch.
(function () {
  var orig = window.fetch.bind(window), on = null;
  var known = /(^|\.)vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
  function detect() {
    if (!on) on = known ? Promise.resolve(false) : orig("/_ssp/config", { cache: "no-store", credentials: "include" })
      .then(function (r) { return r.ok && /json/.test(r.headers.get("content-type") || "") ? r.json().then(function (j) { return !!(j && j.authAvailable); }) : false; })
      .catch(function () { return false; });
    return on;
  }
  window.PLS_SSP = detect;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url;
    if (url && url.indexOf("/api/") === 0) {
      return detect().then(function (ssp) {
        if (!ssp) return orig(input, init);
        return import("/assets/ssp-bridge.js").then(function (m) { return m.handle(url, init || {}); });
      });
    }
    return orig(input, init);
  };
})();
