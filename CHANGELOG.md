# Endringslogg

Alle versjoner er utviklet med Claude (Anthropic) for readymedia. Datoene er fra utviklingssamtalen.

## 1.4.0 – 2026-10-26
### Lagt til
- Dokumentasjon: ny README, `AGENTS.md`, `CLAUDE.md`, `docs/ARKITEKTUR.md`, `docs/DATAFORMAT.md` og en generert `docs/SJANGRE.md` med skjermbilder.
- `npm test` som sjekker syntaks og all sjangerdata, uten avhengigheter.
- `npm run docs` som lager sjangerkatalogen fra koden.
### Endret
- Undersjangrene i toppstripen tones ut tidligere, så de ikke ser ut til å gå inn under tempokontrollene.

## 1.3.0 – 2026-10-26
### Lagt til
- Oppstartsveiviser i 3 steg: mål (lær, bygg eller jam), stil og type. Logoen åpner den igjen.
- Enkel modus som standard. Knappen «Avansert» viser swing, tap, varianter og redigering av lag.

## 1.2.0 – 2026-10-26
### Lagt til
- Sjangerfamilier med 23 undersjangre og en velger i fullskjerm, pluss snarveier i toppstripen.
- «3 regler» per undersjanger med lyttedemoer som styrer avspillingen (`only`, `late`, `gap`).
- «Bygg opp»: ett lag om gangen med forklaring.
- Rutenett-visning med tonehøyde, akkorder, aktivt slag og markører der mønstre starter på nytt.
- Akkordprogresjon per undersjanger. Bass og lead følger akkordene deterministisk.
- Synthwave, gated skarp, pad, supersaw, rumle og flere kicks (forvrengt, raw, gabber).
- Ordliste med 17 begreper.

## 1.1.0 – 2026-10-25
### Lagt til
- Egen fargepalett per sjanger, og Psy Trance, Hardstyle og Nu Disco.
- 45 syntetiserte lyder med lydpool og mønstervarianter per sjanger, «Ny variant», lydbytte og terning.

## 1.0.0 – 2026-10-25
### Lagt til
- Oppsett for touch i 16:9 med 5 EDM-sjangre, mal-med-fingeren-sequencer, tap tempo, swing, fullskjerm og skjerm som holder seg våken.
- Klargjort for Vercel med `vercel.json`, PWA-manifest og ikoner.

## 0.1.0 – 2026-10-25
- Første prototype: lag som pendler (svingetid i annen ∝ lengde), «groove i 3, beat i 4», lyd med Web Audio.
