# Dataformat

All musikk ligger som data i `public/index.html`, i konstantene `SOUNDS` og `FAMILIES`. Mange endringer kan gjøres bare i dataene, for eksempel en ny sjanger, nye regler eller nye mønstre.

Slik sjekker og dokumenterer du endringene:

```bash
npm test        # finner skrivefeil, ukjente lyder og regler som peker på lag som ikke finnes
npm run docs    # oppdaterer docs/SJANGRE.md
```

## Mønstre

Et mønster er en tekststreng med én tegn per 16-del: `x` betyr slag og `.` betyr pause. Lengden er 2–32 tegn, og strengen må ha minst én `x`. **Lengden bestemmer hvor ofte mønsteret gjentas.**

| Mønster | Lengde | Betyr |
|---|---|---|
| `x...x...x...x...` | 16 = 1 takt | Kick på hvert slag (four on the floor) |
| `....x.......x...` | 16 | Skarp eller klapp på 2 og 4 (backbeat) |
| `..x.` | 4 = 1 slag | Offbeat, gjentas hvert slag |
| `.xxx` | 4 | Tre 16-deler etter kicken (psy-bass, «KBBB») |
| `x.x.x.x.x.x.` | 12 = 3 slag | Går i 3 mot takten i 4 og forskyves hver takt |
| `..x..x` | 6 = 1½ slag | Går i 1½ og møter takten igjen hver 3. takt |

Hvis lengden ikke går opp i 16, får du polyrytme. Rutenettet viser da en trekant der mønsteret starter på nytt.

## Familie

```js
{
  id: "techno",                      // unik, brukes i veiviseren
  name: "Techno",
  about: "Repetisjon, trykk og lange fraser.",
  bg: "#090b0e",                     // bakgrunnsfarge for hele appen
  c: ["#9db8d9", …],                 // 6 lagfarger (#rrggbb)
  subs: [ /* undersjangre */ ]
}
```

## Undersjanger

```js
{
  id: "hypno",            // unik på tvers av alle familier. Lagres i localStorage, så ikke endre den.
  name: "Hypnotisk",
  bpm: 138,               // 70–190
  sw: 0,                  // swing 0–40 (prosent av en 16-del)
  tonic: "F",             // grunntone: C, C#/Db … B
  root: 43.65,            // grunntonen i Hz i bassoktaven (cirka 41–75 Hz)
  key: "F-moll",          // vises til brukeren
  mood: "Repetisjon til transe",
  d: "Én tone som aldri stopper …",   // beskrivelse, 1–2 setninger
  acc: "#e8a85c",         // aksentfarge for undersjangeren
  prog: ["Fm"],           // én akkord per takt, gjentas
  bm: [0],                // valgfri: bassbevegelse i halvtoner, per treff
  arp: [0],               // valgfri: rekkefølge gjennom tones, per treff
  tones: [0],             // valgfri: egne toner for lead i halvtoner. Standard er akkordtonene over 2 oktaver.
  L: [ /* lag */ ],       // 1–6 lag
  R: [ /* nøyaktig 3 regler */ ]
}
```

**Akkorder.** En akkord skrives som grunntone + type. Typene er `""` (dur), `m`, `m7`, `maj7`, `7`, `m9` og `sus2`. Eksempler: `"Dm"`, `"Bb"`, `"Fmaj7"`, `"F#m"`. Nye typer legges i `QUAL`.

**Tonehøyde.**
- Bass spiller akkordens grunntone + `bm[treff % bm.length]`.
- Lead spiller akkordens grunntone + `tones[arp[treff % arp.length]]`.
- En lead som aldri skal endre tone får `tones: [0], arp: [0]`. Se Hypnotisk.

## Lag (`L`)

Et lag er en liste med seks elementer:

```js
["pluck",                                // 0 hovedlyd (nøkkel i SOUNDS)
 ["pluck","psylead","stab","arp"],       // 1 lydpool: pilene blar her, «Ny variant» velger herfra. Må inneholde hovedlyden.
 "xxxxxxxxxxxxxxxx",                     // 2 hovedmønster
 ["x.xxx.xxx.xxx.xx"],                   // 3 alternative mønstre for terningen og «Ny variant»
 0,                                      // 4 tetthet 0–1. Over 0 gir terningen tilfeldige mønstre i 35 % av tilfellene.
 "Leaden er én tone i 16-deler …"]      // 5 forklaring brukt i Bygg opp. Kan inneholde {prog} og **fet**.
```

**Lag 0 bør være kicken.** Rekkefølgen er også rekkefølgen i Bygg opp, så sett grunnmuren først.

## Regler (`R`)

Hver undersjanger har nøyaktig 3 regler. En regel viser én tittel og styrer avspillingen slik at regelen høres.

```js
{ t: "La toppen komme sent.",              // tittel. Siste ord blir uthevet i aksentfargen.
  s: "Start med lite topp. La hatsene **komme**.",   // undertekst. Støtter **fet** og {prog}.
  h: "hatsene kommer inn i takt 3",        // lyttehint, vises som «lytt: …»
  on:   [3],          // lag i fokus, vises med full styrke (indekser i L)
  only: [0,3],        // valgfri: bare disse lagene spiller
  late: [3],          // valgfri: disse er stille i takt 1–2 og spiller i takt 3–4
  gap:  [0,1,4] }     // valgfri: disse spiller i takt 1–2 og er stille i takt 3–4
```

Demoen går i sløyfe over 4 takter. Hvordan du viser ulike regler med feltene:

| Regeltype | Oppskrift |
|---|---|
| «Dette elementet alene» | `only: [x]` |
| «X og Y sammen» | `only: [x, y]`, `on: [x, y]` |
| «Kommer inn sent» eller oppbygging | `late: [x]` |
| «Breaket», «ta ut kicken» eller «stopp aldri leaden» | `gap: [trommelag]` |
| «Se mønsteret» (polyrytme) | bare `on` og et `h` som ber brukeren se på rutenettet |

**Lagindeksene peker på posisjoner i `L`.** Hvis du endrer rekkefølgen i `L`, må du oppdatere `on`, `only`, `late` og `gap`. `npm test` sjekker at indeksene finnes, men ikke at de er riktige musikalsk.

**Stil for regeltekst:** kort, i bydeform, og norsk med musikeres egne ord. Rett firer, offbeat, backbeat, 16-deler og 2-step er vanlige uttrykk. Unngå tankestreker som pynt.

## Lyder (`SOUNDS` og `V`)

1. Legg til en oppføring i `SOUNDS`:
   ```js
   cowbell: ["Kubjelle", "perc"]
   ```
   Formatet er `nøkkel: [visningsnavn, rolle]`. Rollen er en av `kick`, `snare`, `hat`, `perc`, `bass`, `lead` og `fx`. Den bestemmer gruppen i lydmenyen, tettheten når terningen lager mønstre og hvordan laget tegnes i rutenettet.
2. Legg til en funksjon med **samme navn** i `V`:
   ```js
   cowbell(t,g){const f=filt("bandpass",2600,3,g);osc("square",540,t,.2,f);osc("square",800,t,.2,f);env(g,t,.35,.18)},
   ```
   Melodiske lyder bruker `x.b()` (bass), `x.l()` (lead) eller `x.cf(m)` og `x.ch.q` (akkord). Se [ARKITEKTUR.md](ARKITEKTUR.md#5-lydmotoren).
3. Lyder som skal spille hele akkorden legges i `CHORDAL`. Lyder som varer lenger enn én 16-del i rutenettet får en lengde i `DUR` (antall steg).
4. Hold volumtoppen rundt 0,1–1. Akkorder med mange oscillatorer trenger lavere volum (0,04–0,1). Kompressoren tar resten.

`npm test` sjekker at hver lyd har en funksjon i `V` og at alle lyder i poolene finnes.

## Legge til en ny undersjanger

1. Kopier en undersjanger i samme familie, eller en ny familie, i `FAMILIES`.
2. Gi den en unik `id`, og sett tempo, swing, toneart (`tonic`, `root`, `key`), `prog` og `acc`.
3. Skriv 4–6 lag. Mønstrene skal vise sjangerens kjennetegn tydelig. Bruk polyrytme bare der den hører hjemme.
4. Skriv 3 regler der demoen faktisk viser regelen: gjør regelen hørbar med `only`, `late` og `gap`.
5. Kjør `npm test` og `npm run docs`.
6. Test i nettleseren:
   - veiviseren: stil → type → lær
   - alle 3 reglene: hører du regelen?
   - Bygg opp
   - rutenettet: ser tonene riktige ut?
   - mobilbredde

Grunntonen `root` i Hz er cirka `55 × 2^((halvtoner fra A) / 12)`, og bør holdes mellom 41 og 75 Hz:

| Tone | Hz |
|---|---|
| E | 41,20 |
| F | 43,65 |
| F♯ | 46,25 |
| G | 49,00 |
| A | 55,00 |
| D | 73,42 |
