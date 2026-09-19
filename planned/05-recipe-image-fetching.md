# Implementationsplan: Automatisk Bildshämtning för Recept

> **Status:** ✅ Automatiserat klart (manuell API-test återstår)
> **Prioritet:** 🟡 Medel
> **Beräknad version:** MINOR (ny funktionalitet)

---

## Bakgrund & Syfte

Appen kan för närvarande generera recept via AI (Gemini) och spara dem som `Meal`-objekt i Firestore. Dock saknas stöd för att automatiskt hämta en passande bild till recepten. 

**Problem:**
- `Meal`-typen har redan fältet `imageUrl?: string` (se `src/types/index.ts` rad 135), men detta fylls aldrig i automatiskt.
- Användare måste manuellt ladda upp eller ange en bild-URL för varje recept.
- AI-tjänsten (`aiService.ts`) genererar endast text (JSON), inte bilder.

**Mål:**
- Automatiskt hämta en passande, royalty-fri bild från ett externt API (t.ex. Unsplash eller Pexels) när ett recept skapas eller berikas via AI.
- Bilden ska sparas som `imageUrl` i `Meal`-objektet.

---

## Val av API

| API | Fördelar | Nackdelar | Kostnad | Beslut |
|---|---|---|---|---|
| **Unsplash API** | Högkvalitativa bilder, gratis, 50 req/h | Kräver API-nyckel, rate limit | Gratis | ✅ Valda |
| **Pexels API** | Gratis, 200 req/h, bra matbilder | Kräver API-nyckel | Gratis | ✅ Fallback |

**Rekommendation:** **Unsplash API** som primär källa, **Pexels** som fallback.

---

## Scope & Avgränsningar

### ✅ Ingår
- Ny service (`imageService.ts`) för att hämta bilder från Unsplash/Pexels.
- Integration med befintlig `aiService.ts` för att automatiskt hämta bild när recept genereras/berikas.
- Uppdatering av `AiRecipeModal` och `MealEditModal` för att visa och hantera bilder.
- Ny komponent `RecipeImageSearchModal` för manuell bildsökning.
- Översättningar för nya UI-element.
- Tester för ny funktionalitet.

### ❌ Ingår inte
- Bildgenerering (t.ex. via DALL-E eller Gemini Image).
- Lokalt bilduppladdning (redan stöd i appen).
- Caching av bilder.

---

## Förutsättningar

### 1. API-nycklar
- [x] Registrera konto på [Unsplash Developer](https://unsplash.com/developers) och få **Access Key**.
- [x] Registrera konto på [Pexels API](https://www.pexels.com/api/) och få API-nyckel.
- [x] Lägg till i `.env`:
  ```env
  VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
  VITE_PEXELS_API_KEY=your_pexels_key
  ```

---

## Implementationssteg

### 📌 Fas 1: Grundläggande Bildshämtning

#### Steg 1.1: Skapa ny service för bildshämtning
- [x] **Fil:** `src/services/imageService.ts` (ny)
- [x] **Funktioner:**
  - [x] `fetchRecipeImage(query: string, size?: 'small' | 'medium' | 'large'): Promise<string | null>` – Hämtar en bild-URL baserat på sökord och storlek.
  - [x] `fetchRecipeImageWithFallback(query: string, size?: 'small' | 'medium' | 'large'): Promise<string | null>` – Försöker Unsplash först, sedan Pexels.
- [x] **API-integration:**
  - [x] Unsplash: `https://api.unsplash.com/search/photos?query={query}&client_id={access_key}&w=400&h=400` (storlek anpassas)
  - [x] Pexels: `https://api.pexels.com/v1/search?query={query}&per_page=1` (använd `src.small`, `src.medium`, eller `src.large`)
- [x] **Caching:**
  - [x] Implementera enkel cache i `localStorage` för att undvika dubbla anrop för samma sökterm.
  - [x] Cache-tid: 24 timmar.
- [x] **Felhantering:**
  - [x] Hantera rate limits (50 req/h för Unsplash, 200 req/h för Pexels).
  - [x] Returnera `null` om ingen bild hittas.

#### Steg 1.2: Tester för imageService
- [x] **Fil:** `src/services/imageService.test.ts` (ny)
- [x] **Testfall:**
  - [x] `fetchRecipeImage` returnerar en giltig URL för en sökterm.
  - [x] `fetchRecipeImage` returnerar `null` om ingen bild hittas.
  - [x] `fetchRecipeImageWithFallback` växlar till Pexels om Unsplash misslyckas.
  - [x] Felhantering för nätverksfel och ogiltiga API-nycklar.
  - [x] Caching fungerar korrekt (mocka `localStorage`).
  - [x] Storleksparameter fungerar korrekt.

---

### 📌 Fas 2: Integration med AI-tjänsten

#### Steg 2.1: Uppdatera `aiService.ts`
- [x] **Fil:** `src/services/aiService.ts`
- [x] **Ändringar:**
  - [x] Importera `fetchRecipeImageWithFallback` från `imageService`.
  - [x] Uppdatera `GeneratedRecipe`-interface för att inkludera `imageUrl?: string`.
  - [x] Uppdatera `generateRecipe(prompt)` för att:
    1. [x] Generera receptet som vanligt.
    2. [x] Extrahera receptnamnet från det genererade receptet.
    3. [x] Anropa `fetchRecipeImageWithFallback(receptnamn)` för att hämta en bild.
    4. [x] Lägga till `imageUrl` i det returnerade `GeneratedRecipe`-objektet.
  - [x] Uppdatera `enrichMeal(meal)` för att:
    1. [x] Berika receptet som vanligt.
    2. [x] Anropa `fetchRecipeImageWithFallback(meal.name)` om `meal.imageUrl` saknas.
    3. [x] Lägga till `imageUrl` i det returnerade objektet.

#### Steg 2.2: Tester för uppdaterad aiService
- [x] **Fil:** `src/services/aiService.test.ts`
- [x] **Testfall:**
  - [x] `generateRecipe` returnerar ett objekt med `imageUrl` om en bild hittas.
  - [x] `generateRecipe` returnerar ett objekt utan `imageUrl` om ingen bild hittas.
  - [x] `generateRecipe` hanterar fel vid bildhämtning och returnerar ändå receptet.
  - [x] `enrichMeal` lägger till `imageUrl` om den saknas och en bild hittas.
  - [x] `enrichMeal` behåller befintlig `imageUrl` och hämtar inte ny bild.
  - [x] `enrichMeal` hanterar fel vid bildhämtning och returnerar ändå receptet.

---

### 📌 Fas 3: Integration med UI

#### Steg 3.1: Uppdatera `AiRecipeModal`
- [x] **Fil:** `src/components/AiRecipeModal.tsx`
- [x] **Ändringar:**
  - [x] Visa den hämtade bilden i förhandsvisningen (om `imageUrl` finns).
  - [x] Lägg till en "Ta bort bild"-knapp för att ta bort bilden.
  - [x] Uppdatera `handleSave` för att inkludera `imageUrl` i det sparade receptet.

#### Steg 3.2: Uppdatera `MealEditModal`
- [x] **Fil:** `src/components/MealEditModal.tsx`
- [x] **Ändringar:**
  - [x] Visa den hämtade bilden i formuläret (om `imageUrl` finns).
  - [x] Lägg till en "Ta bort bild"-knapp för att rensa `imageUrl`.
  - [x] Lägg till en "Sök bild"-knapp som öppnar `RecipeImageSearchModal`.

#### Steg 3.3: Ny komponent: `RecipeImageSearchModal`
- [x] **Fil:** `src/components/RecipeImageSearchModal.tsx`
- [x] **Funktion:**
  - [x] Låter användaren söka efter bilder manuellt via `imageService`.
  - [x] Visa resultat som förhandsvisning.
  - [x] Låter användaren välja en bild att använda som `imageUrl`.

#### Steg 3.4: Tester för UI-komponenter
- [x] **Fil:** `src/components/AiRecipeModal.test.tsx`
- [x] **Testfall:**
  - [x] Bild visas korrekt i förhandsvisningen.
  - [x] "Byt bild"-knappen öppnar `RecipeImageSearchModal`.

- [x] **Fil:** `src/components/MealEditModal.test.tsx`
- [x] **Testfall:**
  - [x] Bild visas korrekt i formuläret.
  - [x] "Ta bort bild"-knappen rensar `imageUrl`.
  - [x] "Sök bild"-knappen öppnar `RecipeImageSearchModal`.

- [x] **Fil:** `src/components/RecipeImageSearchModal.test.tsx`
- [x] **Testfall:**
  - [x] Sökning returnerar bilder.
  - [x] Val av bild uppdaterar `imageUrl`.

---

### 📌 Fas 4: Översättningar

#### Steg 4.1: Uppdatera `sv.json`
- [x] **Fil:** `src/locales/sv.json`
- [ ] **Nycklar att lägga till:**
  ```json
  {
    "ai": {
      "changeImage": "Byt bild"
    },
    "common": {
      "search": "Sök",
      "select": "Välj",
      "cancel": "Avbryt"
    },
    "meals": {
      "noRecipeFound": "Ingen bild hittades",
      "previewRecipe": "Förhandsvisning"
    }
  }
  ```

#### Steg 4.2: Uppdatera `en.json`
- [x] **Fil:** `src/locales/en.json`
- [ ] **Nycklar att lägga till:**
  ```json
  {
    "ai": {
      "changeImage": "Change image"
    },
    "common": {
      "search": "Search",
      "select": "Select",
      "cancel": "Cancel"
    },
    "meals": {
      "noRecipeFound": "No image found",
      "previewRecipe": "Preview"
    }
  }
  ```

---

## Flödesdiagram

```
MealsView
├── [Skapa med AI] → AiRecipeModal
│   ├── Användare skriver prompt → generateRecipe()
│   │   └── fetchRecipeImageWithFallback(receptnamn) → imageUrl
│   ├── Förhandsvisning (inkl. bild)
│   └── [Spara] → addMeal() → Firestore (inkl. imageUrl)
│
└── [Redigera måltid] → MealEditModal
    ├── [Fyll i med AI] → enrichMeal()
    │   └── fetchRecipeImageWithFallback(meal.name) → imageUrl (om saknas)
    ├── [Sök bild] → RecipeImageSearchModal
    │   └── Välj bild → imageUrl
    └── [Spara] → updateMeal() → Firestore (inkl. imageUrl)
```

---

## Validering & Testning

### 📌 Fas 5: Validering

#### Steg 5.1: Kör automatiserade tester
- [x] **Kör:** `npm run validate`
  - [x] Alla tester passerar.
  - [x] Linting är OK.
  - [x] Build lyckas.

#### Steg 5.2: Manuell testning
- [ ] **Testfall:** ⚠️ **Blockerad av ovanstående problem**
  - [ ] Generera ett nytt recept via "Skapa med AI" → bild ska visas automatiskt.
  - [ ] Berika ett befintligt recept via "Fyll i med AI" → bild ska läggas till om den saknas.
  - [ ] Manuell bildsökning via "Sök bild" → bild ska kunna väljas och sparas.
  - [ ] Ta bort en bild via "Ta bort bild" → `imageUrl` ska rensas.
  - [ ] Testa med ogiltiga API-nycklar → felmeddelande ska visas.

---

## Versionshantering

- **Nuvarande version:** `1.21.0` (från `package.json`)
- **Ny version:** `1.21.0` (MINOR – ny funktionalitet)

---

## Beräknad tid

| Fas | Steg | Tid (timmar) |
|---|---|---|
| 1 | Grundläggande bildshämtning | 2 |
| 2 | Integration med AI-tjänsten | 2 |
| 3 | UI-integration | 3 |
| 4 | Översättningar | 1 |
| 5 | Validering & testning | 2 |
| **Totalt** | | **10 timmar** |

---

## Risker & Mitigation

| Risk | Sannolikhet | Impact | Mitigation |
|---|---|---|---|
| Unsplash/Pexels API-nycklar saknas | Medel | Hög | Dokumentera tydligt i README hur man får nycklar. |
| Rate limits nås (50 req/h för Unsplash) | Låg | Medel | Implementera caching av bilder (framtida förbättring). |
| Bilder är inte relevanta för receptet | Medel | Låg | Låta användaren byta bild manuellt. |
| API:er ändrar sina gränssnitt | Låg | Hög | Använda abstraktionslager (`imageService.ts`) för enkel uppdatering.

---

## Framtida förbättringar

1. **Caching av bilder:**
   - Cacha hämtade bilder lokalt för att undvika onödiga API-anrop.
   - Använda `localStorage` eller IndexedDB.

2. **Bildoptimering:**
   - Optimera bildstorlekar för snabbare laddning.
   - Använda `sharp` (redan installerad) för skalning.

3. **Fler bildkällor:**
   - Lägg till stöd för fler API:er (t.ex. Pixabay).

---

## Checklista för godkännande

- [x] Alla automatiserade steg i denna plan är avbockade.
- [x] `npm run validate` passerar.
- [ ] Manuell testning är klar. ⚠️ **Blockerad**
- [x] Version i `package.json` är uppdaterad till `1.21.0`.

---

## Resurser

- [Unsplash API Dokumentation](https://unsplash.com/documentation)
- [Pexels API Dokumentation](https://www.pexels.com/api/documentation/)
- [Befintlig aiService.ts](src/services/aiService.ts)
- [Befintlig Meal-typ](src/types/index.ts)
