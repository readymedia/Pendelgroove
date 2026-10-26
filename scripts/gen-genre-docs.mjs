// Genererer docs/SJANGRE.md fra dataene i public/index.html. Kjør med: npm run docs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadData } from "./extract.mjs";

const { SOUNDS, FAMILIES } = loadData();
const out = fileURLToPath(new URL("../docs/SJANGRE.md", import.meta.url));
const name = (k) => (SOUNDS[k] || [k])[0];
const beats = (n) => (n / 4).toString().replace(".", ",");
const clean = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1");
const total = FAMILIES.reduce((a, f) => a + f.subs.length, 0);

let md = `# Sjangerkatalog

> Generert automatisk fra \`public/index.html\` med \`npm run docs\`. Ikke rediger for hånd.

${FAMILIES.length} familier og ${total} undersjangre. Mønstre er skrevet med \`x\` for slag og \`.\` for pause, én tegn per 16-del.
Regel-feltene forklares i [DATAFORMAT.md](DATAFORMAT.md#regler-r).

`;
md += FAMILIES.map((f) => `- [${f.name}](#${f.id}): ${f.subs.map((s) => s.name).join(", ")}`).join("\n") + "\n";

for (const f of FAMILIES) {
  md += `\n## ${f.name} <a id="${f.id}"></a>\n\n${f.about} Bakgrunn \`${f.bg}\`.\n`;
  for (const s of f.subs) {
    md += `\n### ${s.name} (\`${s.id}\`)\n\n`;
    md += `**${s.bpm} BPM** · swing ${s.sw} % · ${s.key} · akkorder ${s.prog.join(" – ")} · aksent \`${s.acc}\`  \n`;
    md += `*${s.mood}.* ${s.d}\n\n`;
    md += `| # | Lyd | Mønster | Lengde | Lydpool | Forklaring |\n|---|---|---|---|---|---|\n`;
    s.L.forEach((d, i) => {
      md += `| ${i} | ${name(d[0])} | \`${d[2]}\` | ${beats(d[2].length)} slag | ${d[1].map(name).join(", ")} | ${(d[5] || "").replace(/\|/g, "\\|")} |\n`;
    });
    md += `\n**3 regler**\n\n`;
    s.R.forEach((r, i) => {
      const demo = [
        r.only && `bare lag ${r.only.join(", ")} spiller`,
        r.late && `lag ${r.late.join(", ")} kommer inn i takt 3`,
        r.gap && `lag ${r.gap.join(", ")} faller ut i takt 3–4`,
      ].filter(Boolean).join("; ") || "alle lag spiller";
      md += `${i + 1}. **${r.t}** ${clean(r.s)}  \n   Fokus: lag ${r.on.join(", ")}. Demo: ${demo}.\n`;
    });
  }
}
writeFileSync(out, md);
console.log(`Skrev ${out}`);
