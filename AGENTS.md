# AGENTS.md: arbeidsinstruks for AI-agenter og utviklere

Les denne filen først. Med den, [docs/ARKITEKTUR.md](docs/ARKITEKTUR.md) og [docs/DATAFORMAT.md](docs/DATAFORMAT.md) skal du ha full oversikt på et par minutter.

## Prosjektet kort fortalt

- **Hva:** Pendelgroove er et touch-instrument i nettleseren som lærer bort hvordan EDM-sjangre er bygd. Det har 23 undersjangre, hver med 3 regler som kan høres, og visning som pendel eller rutenett. Grensesnittet er på norsk.
- **Hvordan:** Alt ligger i **én fil**, `public/index.html`, med HTML, CSS og vanlig JavaScript. Det er ingen bygging, ingen rammeverk og ingen avhengigheter i kjøretid. All lyd syntetiseres med Web Audio API.
- **Hvor:** Appen publiseres som statisk side på Vercel fra `public/`, og hver push til `main` publiseres automatisk.
- **Opphav:** Prosjektet er utviklet med Claude (Anthropic) for readymedia. Se README.

## Kommandoer

```bash
npm test          # syntakssjekk og validering av all sjangerdata (Node 18+, ingen avhengigheter)
npm run docs      # genererer docs/SJANGRE.md fra dataene. Kjør etter endringer i FAMILIES eller SOUNDS.
npm run dev       # lokal server på :3000 (npx serve public)
```

## Kart over koden i `public/index.html`

Søk etter markørene. Linjenumrene endrer seg.

| Markør | Ansvar |
|---|---|
| `/* ================= sound catalogue` | `SOUNDS` (navn og rolle), `ROLES`, `CHORDAL`, `DUR` |
| `/* ================= genre families` | `FAMILIES`: **alt musikalsk innhold og alle regler** |
| `const PCS=` | Tolker akkorder |
| `function hitIndex` | Deterministisk tonehøyde for bass og lead, `rhythmText` |
| `/* ================= lessons` | `playsAt`: hvilke lag som høres i Regler og Bygg opp |
| `/* ================= audio engine` | `V` (én funksjon per lyd), `voice`, `scheduler`, `setPlaying` |
| `/* ================= UI` | Toppstripe, ark, stativ, tekst under scenen, kontroller |
| `/* ================= drawing` | `frame` (rAF-løkken), `drawPend`, `drawGrid` |
| `/* ================= start wizard` | Veiviser, enkel modus, oppstart |

## Regler som ikke må brytes

1. **Én fil, ingen bygging.** Ikke legg inn rammeverk, bundler eller npm-avhengigheter i appen. Utviklingsskript i `scripts/` og `tests/` kan bruke Node sine innebygde moduler.
2. **Oppdater skriptene hvis markørene endres.** `scripts/extract.mjs` leser data mellom `const ROLES=` og `const GENRES={};`, akkordene mellom `const PCS=` og `const pretty=`, og lydene mellom `const V={` og `function voice(`.
3. **Lydnavn må stemme med funksjonsnavn.** Nøkkelen i `SOUNDS` må finnes som `navn(t,g…)` i `V`.
4. **Regelindekser peker på posisjoner i `L`.** Endrer du rekkefølgen på lag, må `on`, `only`, `late` og `gap` oppdateres.
5. **Tonehøyden skal være deterministisk.** Den regnes ut fra `(lag, steg)` via `hitIndex`. Ikke innfør tilfeldighet eller tellere som lever i lydmotoren, for da viser rutenettet feil toner.
6. **Skjermen skal lese `last` og `pos`, aldri `stepIdx`.** `stepIdx` ligger opptil 120 millisekunder foran det som høres.
7. **Kall `changed(true)` etter strukturelle endringer i `state`, og `changed()` etter små.** Bytte av sjanger går via `chooseGenre(id)`.
8. **Lyd starter bare fra et klikk.** Ikke start avspilling automatisk ved lasting.
9. **localStorage skal alltid ligge i try/catch.** Øk `pendelgroove-v4` til v5 hvis formen på `state` endres.
10. **Alt skal fungere med touch.** Klikkflater skal være minst 44 px (`--tap`). Siden skal virke i 16:9 og i stående format ned til 390 px uten horisontal rulling.
11. **Tekst i appen er på norsk bokmål.** Skriv kort og direkte, med vanlige musikerord. Kode og identifikatorer er på engelsk.
12. **Ikke ta inn innhold fra andre.** Ingen samples, logoer eller tekst fra kildene som har inspirert prosjektet.

## Sjekkliste for en endring

1. Les den aktuelle delen av `public/index.html` og relevant dokumentasjon.
2. Gjør endringen.
3. `npm test` må være grønn.
4. Hvis sjangerdata er endret: kjør `npm run docs` og ta med `docs/SJANGRE.md` i commiten.
5. Test i nettleseren, enten manuelt eller med Playwright (se under):
   - veiviseren: alle 3 målene
   - en sjanger i hver modus: regler, Bygg opp og jam
   - pendel og rutenett
   - 1280×720 og 390×844 uten horisontal rulling
   - ingen feil i konsollen
6. Oppdater `CHANGELOG.md`, og README eller docs hvis oppførselen er endret.
7. Commit med en beskrivende melding på norsk.

## Røyktest med Playwright (valgfritt)

Prosjektet har ikke Playwright som avhengighet. Hvis du har det tilgjengelig:

```js
// node smoke.mjs   (krever: npm i -D playwright && npx playwright install chromium)
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("file://" + process.cwd() + "/public/index.html");
await p.click('[data-goal="learn"]'); await p.click('[data-fam="techno"]'); await p.click('[data-sub="hypno"]');
for (const id of await p.evaluate("Object.keys(GENRES)")) {
  await p.evaluate(`chooseGenre("${id}")`);
  for (let k = 0; k < 3; k++) await p.evaluate(`goLesson(${k})`);
}
await p.waitForTimeout(500);
console.log(errs.length ? errs : "OK"); await b.close();
```

## Kjente begrensninger og ideer

- Det finnes ingen eksport (MIDI eller WAV) og ingen deling av egne varianter med lenke.
- Lagt-til lag (`gi: null`) er ikke med i Bygg opp før det siste steget, og har ingen regler.
- Stilte mønstre tas ikke vare på når brukeren bytter sjanger. Bare siste sjanger lagres.
- Fontene hentes fra Google Fonts. Uten nett brukes systemfonter.
- Appen har bare mørkt tema. Det er et bevisst valg.
- Det finnes også en kopi av appen publisert som Claude-artifact, uten `<head>`. **Repoet er fasit.**
