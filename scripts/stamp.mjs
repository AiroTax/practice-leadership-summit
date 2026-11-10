// SSP serves .js files with "Cache-Control: public, immutable" for 30 days, so browsers keep an
// old copy of the browser-side code after a publish. This stamps a content hash onto every
// script the SSP bridge loads: the loader's <script src>, and an import map that sends each
// module (including the ones imported from inside other modules) to "file.js?v=<hash>".
// The pages themselves are never cached, so a new hash reaches people on the next page load.
//
// Run after changing anything in api/ or assets/ssp-*.js:   npm run stamp
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const files = ["assets/ssp-loader.js", "assets/ssp-bridge.js",
  ...fs.readdirSync(path.join(root, "api")).filter((f) => f.endsWith(".js")).map((f) => "api/" + f),
  ...fs.readdirSync(path.join(root, "api/_lib")).filter((f) => f.endsWith(".js")).map((f) => "api/_lib/" + f)].sort();
const hash = crypto.createHash("sha256");
files.forEach((f) => hash.update(f + "\0" + fs.readFileSync(path.join(root, f))));
const v = hash.digest("hex").slice(0, 10);

const imports = {};
files.filter((f) => f !== "assets/ssp-loader.js").forEach((f) => { imports["/" + f] = "/" + f + "?v=" + v; });
const block = `<script src="/assets/ssp-loader.js?v=${v}"></script>\n<script type="importmap">${JSON.stringify({ imports })}</script>`;

for (const page of ["index.html", "admin.html", "report.html"]) {
  const p = path.join(root, page);
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(/<script src="\/assets\/ssp-loader\.js[^"]*"><\/script>(\n<script type="importmap">.*?<\/script>)?/s, block);
  // The site's other scripts and styles get their own content hash, for the same reason.
  s = s.replace(/"\/assets\/((?!ssp-)[\w-]+\.(?:js|css))(?:\?v=\w+)?"/g, (m, f) => {
    const file = path.join(root, "assets", f);
    if (!fs.existsSync(file)) return m;
    return `"/assets/${f}?v=${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10)}"`;
  });
  fs.writeFileSync(p, s);
}
console.log("Stamped v=" + v + " on " + files.length + " scripts.");
