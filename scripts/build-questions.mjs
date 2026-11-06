// Writes assets/questions.js (the browser copy of api/_lib/questions.js, without Airtable IDs).
import { writeFileSync } from "node:fs";
import { REGISTRATION, PREWORK, REPORT_SECTIONS } from "../api/_lib/questions.js";
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === "f" || k === "summary" ? undefined : v)));
const out = "/* Generated from api/_lib/questions.js by `npm run questions`. Do not edit by hand. */\nwindow.PLS_Q = " +
  JSON.stringify({ REGISTRATION: strip(REGISTRATION), PREWORK: strip(PREWORK), REPORT_SECTIONS }, null, 1) + ";\n";
writeFileSync(new URL("../assets/questions.js", import.meta.url), out);
console.log("assets/questions.js written");
