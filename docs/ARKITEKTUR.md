# Arkitektur

Hele appen ligger i én fil, `public/index.html`, med HTML, CSS og JavaScript. Det er ingen byggesteg, ingen rammeverk og ingen npm-avhengigheter i kjøretid. Den eneste eksterne ressursen er Google Fonts (Syncopate, IBM Plex Sans og IBM Plex Mono), og alle tre har reservefonter.

Dette dokumentet forklarer hvordan delene henger sammen. Felt og eksempler for sjangerdata står i [DATAFORMAT.md](DATAFORMAT.md).

## Innhold

1. [Filoppsett](#1-filoppsett)
2. [Tilstand og lagring](#2-tilstand-og-lagring)
3. [Tid og avspilling](#3-tid-og-avspilling)
4. [Harmoni og tonehøyde](#4-harmoni-og-tonehøyde)
5. [Lydmotoren](#5-lydmotoren)
6. [Leksjoner: 3 regler og Bygg opp](#6-leksjoner-3-regler-og-bygg-opp)
7. [Tegning: pendel og rutenett](#7-tegning-pendel-og-rutenett)
8. [Brukergrensesnitt](#8-brukergrensesnitt)
9. [Stil, tema og layout](#9-stil-tema-og-layout)
10. [Globale funksjoner til feilsøking](#10-globale-funksjoner-til-feilsøking)

## 1. Filoppsett

`public/index.html` er delt inn i blokker. Linjenumrene flytter seg når koden endres, så søk heller etter kommentarmarkørene.

| Del | Søk etter | Innhold |
|---|---|---|
| `<head>` | `<meta name="description"` | Meta, PWA-tagger, fonter |
| CSS | `/* ---- top bar ---- */` og lignende | Tokens på `:root`, komponenter, veiviser, mobil (`/* ---- portrait / narrow ---- */`) |
| Markup | `<div class="app">` | Toppstripe, scene (`.stage`), lagstativ (`#rack`), veiviser (`#wiz`), ark (`#sheet`) |
| Lydkatalog | `/* ================= sound catalogue` | `ROLES`, `SOUNDS`, `ROLE_DENS`, `CHORDAL`, `DUR` |
| Sjangerdata | `/* ================= genre families` | `FAMILIES` (all musikk og alle regler) og `GENRES` (oppslag på id) |
| Akkorder | `const PCS=` | Tolker akkordnavn, `chordsOf`, `chordAt` |
| Tilstand | `let state;` | `loadGenre`, lagring, `regen`, `randomize` |
| Notelogikk | `function hitIndex` | `bassSemi`, `leadSemi`, `noteSemi`, `rhythmText` |
| Leksjoner | `/* ================= lessons` | `lessonSteps`, `playsAt`, `isFocus`, `autoFinal` |
| Lydmotor | `/* ================= audio engine` | Hjelpefunksjoner, `V` (alle lyder), `voice`, `scheduler`, `setPlaying` |
| UI | `/* ================= UI` | Toppstripe, ark, stativ, maling, tekst under scenen, kontroller |
| Tegning | `/* ================= drawing` | `frame`, `drawPend`, `drawGrid`, `playhead` |
| Veiviser | `/* ================= start wizard` | `openWiz`, `renderWiz`, `startFromWiz`, `setSimple`, oppstart |

Oppstarten skjer helt nederst: `syncAll(); setView(view); openWiz(); requestAnimationFrame(frame);`

## 2. Tilstand og lagring

```js
state = {
  genre: "hypno",          // id til undersjangeren (nøkkel i GENRES)
  mod: false,              // true når brukeren har endret noe
  bpm: 138, swing: 0,      // swing i prosent av en 16-del (0–40)
  layers: [{
    sound: "kick",         // nøkkel i SOUNDS
    len: 16,               // mønsterlengde i 16-deler (2–32)
    steps: [1,0,0,0, …],   // alltid 32 lange, bare de første len brukes
    mute: false,
    gi: 0,                 // indeks i sjangerens L, eller null for lag brukeren har lagt til
    color: "#e8a85c"
  }, …]                    // maks 6 lag
}
```

`G()` returnerer den aktive undersjangeren (`GENRES[state.genre]`). `def(l)` returnerer lagdefinisjonen `G().L[l.gi]`.

**Regel:** Kall `changed(full)` etter hver endring i `state`. Den lagrer, merker `mod` og tegner topp og bunntekst på nytt. Med `full=true` tegnes også stativet på nytt. `syncAll()` brukes etter at sjangeren byttes.

**localStorage.** Alle kall er pakket i try/catch fordi lagring kan mangle.

| Nøkkel | Verdi |
|---|---|
| `pendelgroove-v4` | Hele `state` som JSON. Øk versjonsnummeret hvis formen på `state` endres slik at gamle data ikke passer. |
| `pendelgroove-view` | `"pend"` eller `"grid"` |
| `pendelgroove-simple` | `"1"` for enkel modus, `"0"` for avansert |

## 3. Tid og avspilling

Tiden måles i **16-deler**. `stepIdx` er en global teller som starter på 0 når avspillingen begynner. Én takt er 16 steg. `stepDur()` er `60 / bpm / 4` sekunder.

**Planlegging med to klokker.** `scheduler()` kjøres hver 25. millisekund med `setInterval`. Den legger alle steg som skal spilles i løpet av de neste 120 millisekundene inn på Web Audio-klokken (`ac.currentTime`). Dette gir presis timing selv om JavaScript-tråden er travel.

- **Swing:** odde steg forsinkes med `swing / 100 × stepDur()`.
- **Når et lag spiller:** et lag `l` spiller på steg `s` hvis `l.steps[s % l.len]` er satt, laget ikke er dempet og `playsAt(i, s)` er sann.
- **Polyrytme:** den oppstår av seg selv når `len` ikke går opp i 16. Syklusen, altså når alt møtes igjen, er `cycleSteps()`. Det er minste felles multiplum av alle lengdene og 16.

**Synkronisering med skjermen.** Hvert planlagt steg legges i `queue` som `{t, s}`. `frame()` kjører med `requestAnimationFrame` og flytter steg fra køen til `last` når `ac.currentTime` har passert `t`. Den regner også ut `pos`, som er steg med desimaler og brukes til animasjon. Alt som tegnes leser `last` og `pos`, aldri `stepIdx`, fordi `stepIdx` ligger opptil 120 millisekunder foran.

Lyden starter bare etter at brukeren har trykket på noe. Det er derfor `setPlaying(true)` kalles fra klikk-handlere: play-knappen, kortene i veiviseren og leksjonsknappene.

## 4. Harmoni og tonehøyde

Hver undersjanger har:
- `tonic`: grunntonen som navn, for eksempel `"F"`
- `root`: grunntonen i Hz i bassoktaven
- `prog`: en akkordprogresjon med **én akkord per takt**

`chordsOf(gen)` tolker akkordnavnene til `{name, r, q}`:
- `r` er antall halvtoner fra grunntonen, lagt mellom −6 og +6 så bassen ikke hopper en oktav.
- `q` er intervallene i akkorden.

Akkordtyper som støttes ligger i `QUAL`: dur, `m`, `m7`, `maj7`, `7`, `m9` og `sus2`.

**Alt er deterministisk.** `hitIndex(l, s)` teller hvor mange treff laget har hatt før steg `s`. Tonehøyden avhenger bare av `(lag, steg)`. Derfor viser rutenettet nøyaktig de tonene som spilles, og gjentagelser låter likt.

| Funksjon | Gir |
|---|---|
| `bassSemi(l,s)` | Akkordens grunntone + `bm[n % bm.length]`. Oktavbassen legger på +12 på oddetallstreff. |
| `leadSemi(l,s)` | Akkordens grunntone + `tones[arp[n % arp.length]]`. `tones` er akkordtonene over to oktaver hvis sjangeren ikke angir egne. |
| `noteSemi(l,s)` | Riktig verdi ut fra rollen. Akkordinstrumenter (`CHORDAL`) gir akkordens grunntone. |

Frekvensene regnes ut i `voice()`:
- bass: `root × 2^(semi/12)`
- lead: `root × 4 × …`
- akkorder: `root × 4` (pad bruker `× 2` når grunntonen er over 60 Hz)

## 5. Lydmotoren

`initAudio()` lager disse en gang:
- `AudioContext`
- en kompressor på master
- en buffer med ett sekund hvit støy
- to forvrengningskurver: `curve` (tanh) og `curve2` (hard klipping)

**Én lyd = én funksjon i `V`.** Signaturen er `V.navn(t, g, x)`:

| Parameter | Betydning |
|---|---|
| `t` | Starttid på Web Audio-klokken |
| `g` | En ny `GainNode` koblet til master. Lyden setter selv volum og kurve på den. |
| `x.sd` | Lengden på en 16-del i sekunder |
| `x.ch` | Akkorden i denne takten `{name, r, q}` |
| `x.n` | Treffnummer (`hitIndex`). Brukes til aksent og arpeggio. |
| `x.gap` | Antall steg til neste treff. Pads og strykere varer så lenge. |
| `x.b()` | Basstone i Hz |
| `x.l()` | Leadtone i Hz |
| `x.cf(m)` | Akkordens grunntone × `m` i Hz |

Hjelpefunksjoner:

| Funksjon | Gjør |
|---|---|
| `osc(type,f,t,dur,dest)` | Lager en oscillator |
| `nz(t,dur,dest)` | Spiller støy |
| `filt(type,f,q,dest)` | Lager et filter |
| `dist(dest,hard)` | Forvrengning |
| `sub(dest,v)` | Gain-node med verdien `v`. Kan også kobles til en `AudioParam` for LFO. |
| `metal()` | Seks firkantbølger for metalliske hihats |
| `clapF()` | Klapp med flere raske støt |
| `env(g,t,peak,decay)` | Volumkurve |

Nodene lages for hvert treff og ryddes bort av nettleseren når de er ferdige. Det finnes ingen samples eller lydfiler. Ukjente lydnavn faller tilbake til `V.rim`.

## 6. Leksjoner: 3 regler og Bygg opp

`lesson` er `null` når ingen leksjon er aktiv. Ellers er den `{kind: "rules" | "build", i, start}`:
- `i` er nummeret på steget i leksjonen.
- `start` er stegnummeret der dette leksjonssteget begynte. Det rundes opp til neste taktstart.

`lessonSteps()` gir stegene:
- For **regler** er det `G().R`, altså de 3 reglene.
- For **Bygg opp** lages ett steg per lag fra lagets notat og `rhythmText()`, pluss et avsluttende steg fra `autoFinal()`.

**`playsAt(i, s)` bestemmer om lag `i` høres på steg `s` under en leksjon:**
- *Bygg opp:* laget høres bare hvis det er introdusert i et steg til og med det nåværende.
- *Regler:* `rb = relBar(s) % 4` er takten innen en sløyfe på 4 takter.
  - `only`: bare disse lagene spiller.
  - `late`: disse lagene er stille når `rb < 2`, altså i takt 1 og 2.
  - `gap`: disse lagene er stille når `rb ≥ 2`, altså i takt 3 og 4.
- Det avsluttende steget har `final: true`, og da spiller alt.

`isFocus(i)` bestemmer hvilke lag som får full styrke på skjermen. Andre lag dempes visuelt med klassene `.dim` og `.off` i stativet, og med `alphaFor()` i tegningen.

**Automatisk neste steg** skjer i `frame()`:
- Regler: hver `max(4, ~11 sekunder rundet opp til et multiplum av 4 takter)`, slik at hele demoen på 4 takter høres.
- Bygg opp: hver `max(2, ~7 sekunder)`.
- Det siste steget står til brukeren går videre.

Tekst går gjennom `md()`. Den erstatter `{prog}` med akkordene og gjør `**fet**` om til `<b>`.

## 7. Tegning: pendel og rutenett

Én `<canvas>` i `.cbox` skaleres med `devicePixelRatio`, og en `ResizeObserver` følger størrelsen. `frame()` velger tegnefunksjon ut fra `view`.

**`drawPend()`**
- Pendellengden er `(len / maxLen)² × Lmax`, fordi svingetiden i annen er proporsjonal med lengden.
- Vinkelen er `−A·cos(2π · fase)`, der fasen er `(pos % len) / len`.
- Prikkene på buen er treffene. Ytre ring betyr at pendelen er på vei ut, indre ring at den er på vei tilbake.
- `flashes[i]` gir glød når laget treffer.
- Treffpunktene lagres i `bobs[]` slik at et trykk på en pendel demper laget.

**`drawGrid()`**
- Viser én takt (`g0` = starten på takten som spilles), med én rad per lag.
- Navn og `rhythmText()` står til venstre.
- Melodiske lag tegnes med høyde etter `noteSemi()`. Pad og strykere tegnes som blokker med akkordnavn.
- Trekanter markerer hvor mønstre som ikke går opp i 16 starter på nytt.
- Den aktive noten blir hvit, og en vertikal linje viser hvor avspillingen er.
- Radene lagres i `rows[]` slik at et trykk på et lagnavn demper laget.

**Stativet** er DOM og ikke canvas. `renderRack()` bygger alt på nytt etter strukturelle endringer. `playhead()` flytter bare klassen `.now` mellom rutene.

## 8. Brukergrensesnitt

- **Veiviser (`#wiz`).** Vises ved hver oppstart. `wiz = {step, goal, fam}`. `startFromWiz(id)` velger sjanger og setter modus:
  - `learn`: enkel modus, rutenett og regler.
  - `build`: enkel modus, rutenett og Bygg opp.
  - `jam`: avansert modus, pendel og avspilling med en gang.
- **Ark (`#sheet`).** Brukes både til sjangervelgeren (`$("picker").onclick`) og ordlisten (`$("help").onclick`). Lukkes med Escape eller ved å trykke utenfor.
- **Enkel modus.** Klassen `body.simple` skjuler swing, TAP, Ny variant, lengde, lydbytte, terning, sletting og «Legg til lag» med CSS. Du trenger ingen JavaScript-sjekker for dette.
- **Maling av slag.** `pointerdown` på en rute bestemmer om slag skal settes eller fjernes. `pointermove` bruker `elementFromPoint` slik at du kan dra over flere ruter. `.pads` har `touch-action: none`.
- **Tastatur.** Mellomrom spiller og stopper. Piltastene blar i leksjoner. Escape lukker ark og veiviser.

## 9. Stil, tema og layout

- **Bare mørkt tema.** Fargene er tokens på `:root`. `applyTheme()` setter `--accent` (fra undersjangeren) og `--bg` (fra familien). Panelfarger avledes med `color-mix()`, og det finnes en reserve for eldre nettlesere.
- **Lagfarger.** `s.c` er undersjangerens aksent først og deretter familiens palett.
- **16:9 først.** `.app` er et grid med toppstripe og hoveddel. `.main` har to kolonner: scenen og stativet.
- **Mobil og stående format.** `@media (max-aspect-ratio: 1/1), (max-width: 760px)` stabler innholdet og lar siden rulle.
- `[hidden]{display:none!important}` er nødvendig fordi `.sheet` og `.wiz` setter `display: flex`.
- `prefers-reduced-motion` slår av animasjonene i stativet.

## 10. Globale funksjoner til feilsøking

Alt er definert på toppnivå i skriptet, så det kan kalles fra konsollen. Det samme gjelder fra Playwright via `page.evaluate`.

```js
chooseGenre("synthwave")   // bytt undersjanger
setPlaying(true)           // start (krever et klikk først hvis autoplay er blokkert)
setLesson("rules")         // "rules" | "build" | null
goLesson(2)                // hopp til regel 3
setView("grid")            // "pend" | "grid"
setSimple(false)           // vis avanserte kontroller
openWiz()                  // åpne veiviseren
state, GENRES, FAMILIES, SOUNDS
voice({sound:"acid",len:16,steps:pad32(P("x"))}, ac.currentTime, 0)  // spill én lyd
```
