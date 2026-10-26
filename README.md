# Pendelgroove

Polyrytme-verksted der hvert lag er en pendel. Lengden på laget bestemmer
pendelens lengde og hvor sakte den svinger. 23 undersjangre i 6 familier følger med:
- Techno: Hypnotisk, Peak time, Industriell, Polyrytmisk, Acid
- House: Deep house, Tech house, Afro house, Klassisk house
- Trance: Uplifting, Progressive, Psytrance
- Bass og breaks: Drum & bass, Neurofunk, Dubstep, UK garage
- Hard: Hardstyle, Rawstyle, Gabber
- Disco og retro: Synthwave, Italo disco, Nu disco, Electro

Hver undersjanger har egen farge, toneart, akkordprogresjon, lydpool,
mønstervarianter og 3 regler med lyttedemo.
Alle lydene (rundt 50) er syntetisert i nettleseren, så det trengs ingen lydfiler.

Laget for touch i 16:9 (nettbrett eller berøringsskjerm i liggende format).
I stående format stables alt og siden kan rulles.

## Publisere på Vercel

**Alternativ A: via GitHub (anbefalt)**
1. Lag et nytt repo på GitHub og last opp innholdet i denne mappen.
2. Gå til vercel.com/new, velg repoet og trykk Deploy.
   Framework Preset: «Other». Ingen byggekommando trengs, `vercel.json` peker på `public/`.

**Alternativ B: Vercel CLI**
```
npm i -g vercel
cd pendelgroove
vercel          # forhåndsvisning
vercel --prod   # produksjon
```

## Kjøre lokalt
```
npm run dev
```
Åpne adressen som vises (vanligvis http://localhost:3000).

## Bruk
- Ved oppstart kommer en veiviser i 3 steg: hva du vil gjøre (lære, bygge eller jamme), stil og type. Logoen øverst til venstre åpner den igjen.
- «Avansert» viser swing, tap tempo, varianter, lengde og lydbytte. Uten den er skjermen enklere.
- Sjangerknappen øverst åpner velgeren med alle familier. Ved siden av ligger snarveier til undersjangrene i samme familie.
- «3 regler» spiller en demo per regel: lag blir stille eller kommer sent så du hører regelen.
- «Bygg opp» legger til ett lag om gangen med forklaring.
- «Rutenett» viser én takt med tonehøyde, akkorder og markører der mønstre starter på nytt.
- «?» åpner ordlisten.
- Trykk på en sjanger øverst. Trykk igjen for å tilbakestille etter endringer.
- Dra fingeren over rutene for å male inn eller fjerne slag.
- − / + endrer lengden på laget. 16 trinn er én takt, 12 trinn er 3 slag.
- «Ny variant» lager en ny versjon av hele sjangeren med lyder fra sjangerens pool.
- Pilene bytter til neste lyd i sjangeren, terningen lager et nytt mønster for laget.
- Trykk på en pendel for å dempe laget.
- TAP setter tempo. Mellomrom starter og stopper på tastatur.
- «Legg til på Hjem-skjerm» gir fullskjerm i liggende format.

Oppsettet lagres lokalt i nettleseren.

## Filer
- `public/index.html` – hele appen (HTML, CSS og JS i én fil)
- `public/manifest.webmanifest`, `public/icon*` – installerbar som app
- `vercel.json` – utdata-mappe og sikkerhetshoder
