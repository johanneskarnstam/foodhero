# Ikon- och Favicon-generator - Implementationsplan

Denna plan beskriver hur vi inför ett automatiserat skript i repot för att generera och uppdatera **favicon**, **Apple Touch-ikon** och alla **PWA-ikoner** utifrån antingen en **vektorfil (SVG)** eller en **högupplöst bild (PNG/JPG/WebP)**. 

Planen adresserar också de kritiska kraven på **manifest-filer** och **meta-taggar** så att appen installeras och ser ut som en riktig, infödd app på både **iPhone (iOS)** och **Android**.

Planen är utformad i enlighet med riktlinjerna i [`AGENTS.md`](../AGENTS.md).

---

## 📱 Vad krävs för en "riktig" PWA-appikon på iPhone & Android?

För att en app-ikon på hemskärmen ska se ut som en riktig app från App Store eller Google Play (och inte en ful webb-bokmärke med svarta kanter eller avklippta hörn) krävs specifika anpassningar för respektive operativsystem:

### 1. iPhone / iOS krav
- **Ingen transparens i `apple-touch-icon.png`**:
  - iOS stödjer **inte** transparent bakgrund för ikoner på hemskärmen. Om en bild har transparent bakgrund fyller iOS i med **kolsvart färg**.
  - `apple-touch-icon.png` (180x180 px) **måste** därför ha en solid bakgrund (t.ex. vit `#ffffff` eller appens temafärg `#d7e5f5`). Vårt skript ser till att alltid lägga en solid bakgrund på denna fil.
- **Fullskärmsläge och Apple-metadata i `index.html`**:
  - Utan specifika Apple-metataggar öppnas appen inuti vanliga Safari med adressfält och webbläsarknappar.
  - Vi behöver lägga till:
    ```html
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="BuyMilk" />
    ```

### 2. Android krav
- **Maskable Icons (Adaptive Icons)**:
  - Android-tillverkare (Samsung, Google Pixel, Xiaomi m.fl.) klipper hemskärmsikoner till olika former (cirkel, squircle, rundad kvadrat).
  - Om man sätter `purpose: "any maskable"` på en vanlig ikon som går ända ut i kanten, zoomar Android in och **klipper av logotypens kanter**.
  - W3C-standarden definierar en **"Safe Zone"**: all viktig grafik måste rymmas inom den centrala 80%-cirkeln (en radie på 40% från mitten), medan resterande 20% utgör bakgrund som kan beskäras.
  - **Lösning**: Skriptet genererar automatiskt både:
    1. Standardikon (`pwa-192x192.png`, `pwa-512x512.png`) med `purpose: "any"`
    2. Dedikerad maskable ikon (`pwa-maskable-192x192.png`, `pwa-maskable-512x512.png`) med `purpose: "maskable"`, där grafiken skalas in i den säkra 80%-zonen med matchande bakgrundsfärg.
- **PWA Manifest (`vite.config.ts`)**:
  - Manifestet måste ha:
    - `display: "standalone"` (tar bort webbläsarens adressfält och menyflikar på Android).
    - `background_color: "#ffffff"` (används som bakgrund på splash-skärmen medan appen laddas).
    - `theme_color: "#ffffff"` (färgar statusfältet).
    - Separata poster för `purpose: "any"` och `purpose: "maskable"`.

---

## 🎯 Krav & Mål

### Funktionella krav
1. **Stöd för källfiler**:
   - **SVG (`.svg`)**: Skalas vektoriellt utan kvalitetsförlust till alla dimensioner.
   - **Bilder (`.png`, `.jpg`, `.webp`)**: Skalas med högkvalitativ bicubic/lanczos-interpolering.
2. **Genererade filer till `public/`**:
   - `favicon.png` (128x128 – för flikar, bokmärken och in-app logotyp i `Sidebar`/`Layout`)
   - `apple-touch-icon.png` (180x180 – med garanterad solid bakgrund för iOS)
   - `pwa-192x192.png` (192x192 – standard PWA)
   - `pwa-512x512.png` (512x512 – standard PWA för splash/dialoger)
   - `pwa-maskable-192x192.png` (192x192 – med 80% safe-zone för Android)
   - `pwa-maskable-512x512.png` (512x512 – med 80% safe-zone för Android)
   - `icon.png` (512x512 – allmän fallback)
3. **Konfigurationsuppdateringar**:
   - `vite.config.ts`: Uppdatera `VitePWA`-manifestet med maskable ikoner, `display: 'standalone'` och `background_color`.
   - `index.html`: Komplettera med Apple Mobile Web App-metataggar.
4. **CLI-kommando**:
   - `npm run generate-icons -- <sökväg>`
   - Körning utan argument faller tillbaka på standardfil (t.ex. `public/icon_foodhero.svg` eller `public/icon.svg`).

---

## 🏗️ Teknisk Design & Arkitektur

### Val av bibliotek: `sharp`
- Blixtsnabb bildhantering byggd på C++ (`libvips`).
- Native stöd för SVG-rendering via `librsvg`.
- Kan automatiskt identifiera dominerande bakgrundsfärg eller ta emot en färgflagga för att skapa maskable bakgrunder och solid bakgrund för Apple Touch-ikonen.
- Installeras som `devDependency` – 0 byte tillägg i produktions-koden.

### Ikon- och konfigurationsmatris i `scripts/generate-icons.js`:
```javascript
const ICON_CONFIG = [
  { name: 'favicon.png', size: 128, maskable: false, opaque: false },
  { name: 'apple-touch-icon.png', size: 180, maskable: false, opaque: true },
  { name: 'pwa-192x192.png', size: 192, maskable: false, opaque: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false, opaque: false },
  { name: 'pwa-maskable-192x192.png', size: 192, maskable: true, opaque: true },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true, opaque: true },
  { name: 'icon.png', size: 512, maskable: false, opaque: false },
];
```

### Manifest i `vite.config.ts`:
```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.png', 'apple-touch-icon.png'],
  manifest: {
    name: 'Buy milk',
    short_name: 'Buy milk',
    description: 'A progressive list management app',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/buymilk/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'pwa-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: 'pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
})
```

---

## 🚀 Steg-för-steg Implementering (Chunks)

### 📦 CHUNK 1: Branch & Beroenden
**Mål**: Sätta upp branch och installera `sharp`.
1. Skapa branch:
   ```bash
   git checkout -b feature/icon-generator-script
   ```
2. Installera:
   ```bash
   npm install --save-dev sharp
   ```

### 🛠️ CHUNK 2: Bygg `scripts/generate-icons.js`
**Mål**: Skapa det smarta skriptet med stöd för standardikoner, maskable ikoner och solid bakgrund för Apple Touch.
1. Hantera kommandoradsargument och fallback-sökning.
2. Läs in bild/SVG med `sharp`.
3. Beräkna maskable padding (80% skalning centrerad på solid bakgrundsplatta) för `*-maskable-*.png`.
4. Skapa solid bakgrund (t.ex. från SVG:ns bakgrund eller vit `#ffffff`) för `apple-touch-icon.png` så att iOS aldrig visar svart bakgrund.
5. Spara alla 7 ikonfilerna till `public/`.
6. Logga resultat i terminalen med status och filstorlekar.

### ⚙️ CHUNK 3: Uppdatera Manifest & Meta-taggar
**Mål**: Se till att appen registreras som en riktig native PWA på iOS och Android.
1. **`vite.config.ts`**:
   - Lägg till `display: 'standalone'`.
   - Lägg till `background_color: '#ffffff'`.
   - Lägg till de nya maskable-ikonerna i `icons`-arrayen med `purpose: 'maskable'`.
   - Ändra befintliga ikoner till `purpose: 'any'`.
2. **`index.html`**:
   - Lägg till `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` och `apple-mobile-web-app-title`.

### 📜 CHUNK 4: Registrera npm-script
**Mål**: Enkel körning via package.json.
1. Lägg till `"generate-icons": "node scripts/generate-icons.js"` i `package.json`.

### 🧪 CHUNK 5: Validering & Verifiering
**Mål**: Köra skriptet och verifiera med `npm run validate`.
1. Kör genereringen:
   ```bash
   npm run generate-icons -- public/icon_foodhero.svg
   ```
2. Verifiera i webbläsare:
   - Chrome DevTools > Application > Manifest: Kontrollera att både standard och maskable ikoner visas utan varningar.
3. Kör obligatorisk validering:
   ```bash
   npm run validate
   ```

---

## 💬 Sammanfattning av svar till användaren
- **Behövs ändringar i manifestet?** Ja! För Android behöver vi separera `purpose: "any"` och `purpose: "maskable"`, samt lägga till `display: "standalone"` och `background_color: "#ffffff"`.
- **Behövs ändringar för iPhone?** Ja! `apple-touch-icon.png` måste ha solid bakgrund, och `index.html` behöver Apple-specifika meta-taggar för att dölja Safaris webbläsarkontroller vid hemskärmsstart.
