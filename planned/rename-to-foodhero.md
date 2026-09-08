# Implementationsplan: Namnbyte BuyMilk → FoodHero

## Bakgrund & Mål
Projektet startade som en ren inköpslista (**BuyMilk**) men har vuxit till en komplett app för **måltidsplanering, recept och inköp**. För att bättre spegla appens syfte och framtid byts namnet till **FoodHero**.

Denna plan bryter ner namnbytet i små, kontrollerade och verifierbara steg så att migreringen kan genomföras smidigt utan avbrott eller dataförlust för befintliga användare.

---

## Översikt över faser

1. [Fas 1: UI & Språkstöd (i18n)](#fas-1-ui--språkstöd-i18n)
2. [Fas 2: Sidtitlar, Vyer & Komponenter](#fas-2-sidtitlar-vyer--komponenter)
3. [Fas 3: LocalStorage & Bakåtkompatibel datamigrering](#fas-3-localstorage--bakåtkompatibel-datamigrering)
4. [Fas 4: PWA-manifest, HTML & Ikoner](#fas-4-pwa-manifest-html--ikoner)
5. [Fas 5: Kalender, Export & Delningslänkar](#fas-5-kalender-export--delningslänkar)
6. [Fas 6: Projektkonfiguration & Beroenden](#fas-6-projektkonfiguration--beroenden)
7. [Fas 7: GitHub Repository & Hosting (GitHub Pages)](#fas-7-github-repository--hosting-github-pages)
8. [Fas 8: Dokumentation & Projektfiler](#fas-8-dokumentation--projektfiler)
9. [Fas 9: Validering & Slutverifiering](#fas-9-validering--slutverifiering)

---

## Steg-för-steg i små bitar

### Fas 1: UI & Språkstöd (i18n)

Mål: Ändra namn och produktbeskrivningar i appens översättningsfiler så att appens nya identitet som måltidsplanerare och inköpshjälpreda etableras.

#### Steg 1.1: Uppdatera svenska språket (`src/locales/sv.json`)
- [x] Uppdatera apptitel:
  ```json
  "app": {
    "title": "FoodHero"
  }
  ```
- [x] Uppdatera välkomsttext och undertitel på landningssidan för att betona måltidsplanering:
  ```json
  "landing": {
    "welcome": "Välkommen till FoodHero",
    "subtitle": "Smart måltidsplanering & inköpslista"
  }
  ```
- [x] Uppdatera eventuella omnämnanden i aktivitetsloggen och övriga sektioner:
  ```json
  "activity": {
    "subtitle": "Senaste uppdateringar och förbättringar i FoodHero"
  }
  ```

#### Steg 1.2: Uppdatera engelska språket (`src/locales/en.json`)
- [x] Uppdatera apptitel:
  ```json
  "app": {
    "title": "FoodHero"
  }
  ```
- [x] Uppdatera välkomsttext och undertitel:
  ```json
  "landing": {
    "welcome": "Welcome to FoodHero",
    "subtitle": "Smart Meal Planning & Grocery Lists"
  }
  ```
- [x] Uppdatera aktivitetslogg:
  ```json
  "activity": {
    "subtitle": "Recent updates and improvements to FoodHero"
  }
  ```

---

### Fas 2: Sidtitlar, Vyer & Komponenter

Mål: Säkerställa att komponenter använder i18n och inte har hårdkodade "BuyMilk"-strängar eller inaktuella logotyper/texter.

#### Steg 2.1: Header & Layout (`src/components/Layout.tsx`)
- [x] Ersätt hårdkodad rubrik `<h1 className="text-2xl font-bold text-[#2c6de3]">BuyMilk</h1>` med `{t('app.title', 'FoodHero')}`.
- [x] Säkerställ att logotypens alt-text är `"FoodHero logo"`.

#### Steg 2.2: Sidopanel (`src/components/Sidebar.tsx`)
- [x] Uppdatera rubriken från `BuyMilk` till `{t('app.title', 'FoodHero')}`.
- [x] Justera eventuell bild-alt eller logoreferens.

#### Steg 2.3: Startsida (`src/components/HomeView.tsx`)
- [x] Ändra fallback från `BuyMilk` till `FoodHero`:
  `{t('app.title', 'FoodHero')}`.

#### Steg 2.4: Landningssida (`src/components/LandingPage.tsx`)
- [x] Ändra fallback från `{t('landing.welcome', 'Welcome to BuyMilk')}` till `{t('landing.welcome', 'Welcome to FoodHero')}`.

#### Steg 2.5: Dynamiska sidtitlar (`document.title`)
- [x] `src/components/GroceryListView.tsx`:
  Byt från `document.title = 'BuyMilk - ' + ...` till `document.title = 'FoodHero - ' + ...` (eller skapa en liten hjälpfunktion `setPageTitle(title)`).
- [x] `src/components/ListDetail.tsx`:
  Byt från `document.title = 'BuyMilk - ' + ...` till `document.title = 'FoodHero - ' + ...`.

#### Steg 2.6: Uppdateringsprompt (`src/components/UpdatePrompt.tsx`) & Aktivitetslogg (`src/components/ActivityLog.tsx`)
- [x] Uppdatera GitHub-repolänk från `github.com/jojjeboy/buymilk` till `github.com/jojjeboy/foodhero`.
- [x] Justera fetch-path för commits från `/buymilk/commits.json` till `/foodhero/commits.json` (eller gör den relativ till `import.meta.env.BASE_URL`).

---

### Fas 3: LocalStorage & Bakåtkompatibel datamigrering

Mål: Byta ut lagringsnycklar i webbläsaren utan att befintliga användare förlorar sitt sparade språk eller får dubbla uppdateringsnotiser.

#### Steg 3.1: Språknyckel i i18n (`src/i18n.ts`)
- [x] Ändra `lookupLocalStorage` från `buymilk_language` till `foodhero_language`.
- [x] Lägg till engångsmigrering vid app-start:
  ```ts
  const oldLang = localStorage.getItem('buymilk_language');
  if (oldLang && !localStorage.getItem('foodhero_language')) {
    localStorage.setItem('foodhero_language', oldLang);
  }
  ```

#### Steg 3.2: What's New-modal (`src/hooks/useWhatsNew.ts`)
- [x] Ändra `STORAGE_KEY` från `'buymilk:whats-new-last-seen'` till `'foodhero:whats-new-last-seen'`.
- [x] Läs bakåtkompatibelt: Om `'foodhero:whats-new-last-seen'` saknas, kontrollera om `'buymilk:whats-new-last-seen'` finns och migrera värdet.
- [x] Uppdatera testerna i `src/hooks/useWhatsNew.test.ts` så att de matchar nya nyckeln och verifierar bakåtkompatibiliteten.

---

### Fas 4: PWA-manifest, HTML & Ikoner

Mål: Anpassa HTML-skalet och PWA-manifestet för den nya profilen som måltidsplanerare, och generera nya ikoner.

#### Steg 4.1: `index.html`
- [x] Uppdatera `<title>` till `FoodHero`.
- [x] Uppdatera `<meta name="apple-mobile-web-app-title" content="FoodHero" />`.
- [x] Säkerställ att favicon-länkarna använder relativ sökväg eller korrekt bas-sökväg:
  `<link rel="icon" type="image/png" href="./favicon.png" />`
  `<link rel="apple-touch-icon" href="./apple-touch-icon.png" />`

#### Steg 4.2: Vite & PWA (`vite.config.ts`)
- [x] Uppdatera `base`: ändra från `'/buymilk/'` till `'/foodhero/'` (utförs i samband med rename av GitHub-repot).
- [x] Uppdatera PWA-manifest:
  - `name`: `'FoodHero - Måltidsplanering & Inköp'`
  - `short_name`: `'FoodHero'`
  - `description`: `'Smart måltidsplanering, recept och inköpslista'`
  - `start_url`: `'/foodhero/'`

#### Steg 4.3: Ikoner & Favicon
- [x] Skapa eller välj en FoodHero-appikon (t.ex. tallrik/bestick/kockmössa/avokado istället för mjölkpaket).
- [x] Placera originalbilden i `public/FoodHero-icon.png` eller `public/icon_foodhero.svg`.
- [x] Kör generator-skriptet:
  ```bash
  npm run generate-icons
  ```
- [x] Kontrollera att `public/favicon.png`, `apple-touch-icon.png`, `pwa-192x192.png` och `pwa-512x512.png` har uppdaterats med den nya designen.

---

### Fas 5: Kalender, Export & Delningslänkar

Mål: Se till att exporterade filer och externa länkar reflekterar FoodHero.

#### Steg 5.1: Kalenderexport (`src/utils/calendarUtils.ts`)
- [x] Ändra `PRODID`:
  Från `PRODID:-//BuyMilk//MealPlan//SV` till `PRODID:-//FoodHero//MealPlan//SV`.
- [x] Ändra UID-domän:
  Från `lunch-${dateStr}@buymilk.app` till `lunch-${dateStr}@foodhero.app`.

#### Steg 5.2: JSON-export & Backup (`src/components/SettingsView.tsx`)
- [x] Byt föreslaget filnamn vid export från:
  `buymilk-shopping-list.json` till `foodhero-backup.json`.
- [x] Säkerställ att JSON-importen fortfarande kan läsa äldre filer som exporterats under BuyMilk-namnet.

#### Steg 5.3: Delningslänkar för listor (`src/components/ListDetail.tsx`)
- [x] Uppdatera genererad delningslänk:
  Byt bas-URL från `https://jojjeboy.github.io/buymilk/#/list/...` till `https://jojjeboy.github.io/foodhero/#/list/...`.

---

### Fas 6: Projektkonfiguration & Beroenden

Mål: Byta namn i `package.json` och säkerställa att utvecklingsmiljön är synkroniserad.

#### Steg 6.1: `package.json`
- [x] Ändra `"name": "buymilk"` till `"name": "foodhero"`.
- [x] Synkronisera `package-lock.json` via `npm install` eller `npm run validate`.

#### Steg 6.2: Firebase Emulators & Config
- [x] Kontrollera att `.firebaserc` eller miljövariabler (`VITE_FIREBASE_PROJECT_ID`) hanteras flexibelt. Befintlig Firebase-instans kan fortsätta användas som backend utan att kräva omedelbar databasmigrering om användaren önskar behålla befintligt projekt under huven.

---

### Fas 7: GitHub Repository & Hosting (GitHub Pages)

Mål: Ändra namn på GitHub-repot och säkerställa att CI/CD bygger och driftsätter till rätt sökväg.

#### Steg 7.1: Byt namn på GitHub-repot (Körs via GitHub webb / gh CLI)
- [x] Byt repository name på GitHub från `buymilk` till `foodhero`.
- [x] Uppdatera git remote i det lokala projektet:
  ```bash
  git remote set-url origin https://github.com/Jojjeboy/foodhero.git
  git remote -v
  ```

#### Steg 7.2: GitHub Pages URL & 404-redirect
- [x] Ny GitHub Pages URL blir: `https://jojjeboy.github.io/foodhero/`.
- [x] (Valfritt) Skapa `public/404.html` för att automatiskt vidarebefordra användare från gamla bokmärken:
  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Omdirigerar till FoodHero...</title>
      <script>
        const target = window.location.href.replace('/buymilk/', '/foodhero/');
        window.location.replace(target);
      </script>
    </head>
    <body>
      <p>Omdirigerar till FoodHero... <a href="https://jojjeboy.github.io/foodhero/">Klicka här om du inte omdirigeras automatiskt</a>.</p>
    </body>
  </html>
  ```

---

### Fas 8: Dokumentation & Projektfiler

Mål: Uppdatera projektets huvuddokumentation så att den beskriver FoodHero som måltidsplaneringsapp.

#### Steg 8.1: `README.md`
- [x] Uppdatera huvudrubrik till `# FoodHero 🍲`.
- [x] Skriv om ingressen för att lyfta måltidsplanering, matsedel, receptintegration och inköpslista.
- [x] Uppdatera installationsinstruktioner (`git clone .../foodhero.git`, `cd foodhero`).
- [x] Uppdatera skärmdumpar och länkar.

#### Steg 8.2: `planned/README.md`
- [x] Uppdatera referenser till FoodHero.

---

### Fas 9: Validering & Slutverifiering

Mål: Verifiera att inga trasiga referenser eller regressionsfel introducerats.

#### Steg 9.1: Automatiserad kodgranskning och validering
- [x] Kör linters och typtest:
  ```bash
  npm run lint
  npm run check-any
  ```
- [x] Kör enhetstester:
  ```bash
  npm run test
  ```
- [x] Bygg produktionspaket:
  ```bash
  npm run build:only
  ```
- [x] Kör komplett validering:
  ```bash
  npm run validate
  ```

#### Steg 9.2: Manuell verifiering i webbläsare
- [x] Kör `npm run dev` och testa:
  - Header, sidopanel och startsida visar "FoodHero".
  - Språkväxling mellan svenska och engelska fungerar sömlöst.
  - PWA-manifest läses in korrekt (`DevTools -> Application -> Manifest`).
  - Nya ikoner syns i flikar och som bokmärkesikon.
  - Kalenderexport och delningslänk fungerar.
  - Test av offline-stöd och What's New-modal.

---

## Sammanfattande checklista

- [x] Fas 1: UI & Språkstöd (sv.json, en.json)
- [x] Fas 2: Layout, Sidebar, HomeView, GroceryListView, ListDetail
- [x] Fas 3: LocalStorage bakåtkompatibilitet (i18n, useWhatsNew)
- [x] Fas 4: index.html och PWA-manifest
- [x] Fas 5: calendarUtils, SettingsView export, ListDetail delningslänk
- [x] Fas 6: package.json (foodhero)
- [x] Fas 7: GitHub repo-namn, remote URL, Pages URL
- [x] Fas 8: README.md och dokumentation
- [x] Fas 9: `npm run validate` 100% grönt och manuell verifiering
