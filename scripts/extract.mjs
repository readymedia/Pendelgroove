// Leser public/index.html og henter ut sjanger- og lyddata uten nettleser.
// Brukes av tests/validate.mjs og scripts/gen-genre-docs.mjs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const INDEX = fileURLToPath(new URL("../public/index.html", import.meta.url));

export function readHtml() {
  return readFileSync(INDEX, "utf8");
}

/** Hele inline-skriptet (det siste <script> uten src). */
export function inlineScript(html = readHtml()) {
  const all = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (!all.length) throw new Error("Fant ikke inline <script> i public/index.html");
  return all[all.length - 1][1];
}

/** Evaluerer datadelen (fra ROLES til og med FAMILIES) og returnerer objektene. */
export function loadData(html = readHtml()) {
  const js = inlineScript(html);
  const start = js.indexOf("const ROLES=");
  const end = js.indexOf("const GENRES={};");
  if (start < 0 || end < 0) throw new Error("Fant ikke markørene 'const ROLES=' og 'const GENRES={};'");
  const chordStart = js.indexOf("const PCS=");
  const chordEnd = js.indexOf("const pretty=");
  const code =
    js.slice(start, end) +
    js.slice(chordStart, chordEnd) +
    "\n;({ROLES,SOUNDS,ROLE_DENS,CHORDAL,DUR,FAMILIES,PCS,QUAL})";
  const data = vm.runInNewContext(code, {});
  const vStart = js.indexOf("const V={");
  const vEnd = js.indexOf("function voice(");
  data.voiceSource = js.slice(vStart, vEnd);
  return data;
}
