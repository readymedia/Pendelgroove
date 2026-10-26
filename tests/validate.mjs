// Statisk sjekk av public/index.html. Kjør med: npm test
// Sjekker at skriptet kan parses, og at all sjangerdata henger sammen.
import vm from "node:vm";
import { readHtml, inlineScript, loadData } from "../scripts/extract.mjs";

const errors = [];
const fail = (msg) => errors.push(msg);
const html = readHtml();

// 1. Syntaks
try {
  new vm.Script(inlineScript(html), { filename: "public/index.html <script>" });
} catch (e) {
  fail(`Syntaksfeil i inline-skriptet: ${e.message}`);
}

// 2. Data
let data;
try {
  data = loadData(html);
} catch (e) {
  fail(`Klarte ikke å lese data: ${e.message}`);
}

if (data) {
  const { ROLES, SOUNDS, FAMILIES, PCS, QUAL, voiceSource } = data;
  const hex = /^#[0-9a-f]{6}$/i;
  const pat = /^[x.]{2,32}$/;
  const chordRe = new RegExp(`^([A-G][b#]?)(${Object.keys(QUAL).map((q) => q.replace(/\W/g, "\\$&")).join("|")})$`);

  // Lyder
  for (const [k, v] of Object.entries(SOUNDS)) {
    if (!Array.isArray(v) || v.length !== 2) fail(`SOUNDS.${k} må være [navn, rolle]`);
    else if (!ROLES[v[1]]) fail(`SOUNDS.${k} har ukjent rolle "${v[1]}"`);
    if (!new RegExp(`\\b${k}\\(t,g`).test(voiceSource)) fail(`SOUNDS.${k} mangler lydfunksjon i V`);
  }

  // Familier og undersjangre
  const ids = new Set();
  for (const f of FAMILIES) {
    for (const key of ["id", "name", "about", "bg"]) if (!f[key]) fail(`Familie ${f.id}: mangler ${key}`);
    if (!hex.test(f.bg)) fail(`Familie ${f.id}: bg må være #rrggbb`);
    if (!Array.isArray(f.c) || f.c.length < 6 || !f.c.every((c) => hex.test(c))) fail(`Familie ${f.id}: c må ha 6 farger`);
    if (!f.subs?.length) fail(`Familie ${f.id}: har ingen undersjangre`);

    for (const s of f.subs || []) {
      const at = `${f.id}/${s.id}`;
      if (ids.has(s.id)) fail(`${at}: id er brukt fra før`);
      ids.add(s.id);
      for (const key of ["id", "name", "key", "mood", "d", "tonic", "acc"]) if (!s[key]) fail(`${at}: mangler ${key}`);
      if (!(s.bpm >= 70 && s.bpm <= 190)) fail(`${at}: bpm må være 70–190 (glidebryteren)`);
      if (!(s.sw >= 0 && s.sw <= 40)) fail(`${at}: sw (swing) må være 0–40`);
      if (!(s.root > 20 && s.root < 120)) fail(`${at}: root (Hz) ser feil ut: ${s.root}`);
      if (!(s.tonic in PCS)) fail(`${at}: ukjent tonic "${s.tonic}"`);
      if (!hex.test(s.acc || "")) fail(`${at}: acc må være #rrggbb`);
      if (!s.prog?.length) fail(`${at}: prog mangler`);
      for (const c of s.prog || []) if (!chordRe.test(c)) fail(`${at}: akkorden "${c}" kan ikke tolkes`);
      for (const key of ["bm", "arp", "tones"]) if (s[key] && !s[key].every(Number.isInteger)) fail(`${at}: ${key} må være heltall`);

      if (!s.L?.length || s.L.length > 6) fail(`${at}: må ha 1–6 lag (L)`);
      (s.L || []).forEach((d, i) => {
        const li = `${at} lag ${i}`;
        if (!Array.isArray(d) || d.length < 5) return fail(`${li}: må være [lyd, pool, mønster, varianter, tetthet, notat]`);
        const [snd, pool, main, alts, dens, note] = d;
        if (!SOUNDS[snd]) fail(`${li}: ukjent lyd "${snd}"`);
        if (!Array.isArray(pool) || !pool.includes(snd)) fail(`${li}: pool må inneholde hovedlyden "${snd}"`);
        for (const p of pool || []) if (!SOUNDS[p]) fail(`${li}: ukjent lyd i pool "${p}"`);
        if (!pat.test(main) || !main.includes("x")) fail(`${li}: mønsteret "${main}" må være 2–32 tegn x/. med minst én x`);
        for (const a of alts || []) if (!pat.test(a) || !a.includes("x")) fail(`${li}: variant "${a}" er ugyldig`);
        if (!(dens >= 0 && dens <= 1)) fail(`${li}: tetthet må være 0–1`);
        if (note !== undefined && typeof note !== "string") fail(`${li}: notat må være tekst`);
      });

      if (s.R?.length !== 3) fail(`${at}: må ha nøyaktig 3 regler (R)`);
      (s.R || []).forEach((r, i) => {
        const ri = `${at} regel ${i + 1}`;
        for (const key of ["t", "s", "h"]) if (!r[key]) fail(`${ri}: mangler ${key}`);
        if (!r.on?.length) fail(`${ri}: on (fokuslag) mangler`);
        for (const key of ["on", "only", "late", "gap"])
          for (const idx of r[key] || []) if (!(idx >= 0 && idx < s.L.length)) fail(`${ri}: ${key} peker på lag ${idx}, som ikke finnes`);
        if (r.only && r.on && !r.on.every((x) => r.only.includes(x))) fail(`${ri}: alle lag i on bør også være i only`);
      });
    }
  }
  console.log(`Sjekket ${Object.keys(SOUNDS).length} lyder, ${FAMILIES.length} familier og ${ids.size} undersjangre.`);
}

if (errors.length) {
  console.error(`\n${errors.length} feil:\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("OK");
