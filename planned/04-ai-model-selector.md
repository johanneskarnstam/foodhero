# Plan 04 – Dynamisk AI-modellista via Gemini API & Inställningar (Alternativ 2)

## Mål

Göra det möjligt för appen att dynamiskt hämta tillgängliga Gemini-modeller direkt från Googles Gemini API (`listModels`), filtrera fram modeller som stöder innehållsgenerering, samt låta användaren välja och byta aktiv modell direkt i appens inställningsvy. Valet sparas i `localStorage` och slår igenom omedelbart vid receptgenerering utan att appen behöver byggas om.

---

## Bakgrund & Teknisk lösning

### Nuläge
- Modeller är hårdkodade i `src/services/aiService.ts`:
  ```typescript
  const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
  export const FALLBACK_MODEL = 'gemini-2.5-flash';
  ```
- Det finns inget sätt för användare eller administratör att se eller välja nyare modeller när Google lanserar dem (t.ex. Gemini 3.8 Flash, Gemini 2.5 Pro) utan att ändra miljövariabler eller källkod.

### Alternativ 2: Dynamisk hämtning via Gemini API
1. **Google AI REST API:** Anropar `GET https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`.
2. **Filtrering & Normalisering:**
   - Behåll endast modeller med `supportedGenerationMethods` som inkluderar `"generateContent"`.
   - Exkludera rena embedding-modeller, AQA och modeller som inte lämpar sig för text/receptgenerering.
   - Normalisera id (ta bort prefixet `models/`, t.ex. `models/gemini-2.5-flash` → `gemini-2.5-flash`).
3. **Robusthet & Caching:**
   - Spara hämtade modeller i `localStorage` (`foodhero_gemini_models_cache`) med tidsstämpel (t.ex. 24h TTL) för att minimera onödiga API-anrop.
   - Om anropet misslyckas (t.ex. offline, kvot eller ogiltig nyckel) används alltid en hårdkodad lista med beprövade standardmodeller (`DEFAULT_GEMINI_MODELS`).
4. **Användarval:**
   - Vald modell sparas i `localStorage` (`foodhero_ai_model`).
   - `aiService.ts` hämtar vald modell vid runtime:
     `Vald modell i localStorage` → `VITE_GEMINI_MODEL` → `DEFAULT_GEMINI_MODEL`.
5. **UI & UX:**
   - En dedikerad AI-sektion i `SettingsView.tsx`.
   - Visar aktiv modell, lista över tillgängliga modeller med beskrivning och taggar.
   - Knapp för att manuellt hämta/uppdatera modellistan från Google med laddningsindikator och felhantering.
   - Toast-bekräftelse vid modellbyte.

---

## Checklista & Steg-för-steg implementation

### Steg 1: Typdefinitioner & konstanter (`src/types/index.ts`)
- [x] **1.1** Definiera `AIModelOption`-gränssnittet i `src/types/index.ts`:
  ```typescript
  export interface AIModelOption {
      id: string;            // t.ex. 'gemini-2.5-flash'
      name: string;          // t.ex. 'Gemini 2.5 Flash'
      description: string;   // Kort beskrivning av egenskaper
      isOnline?: boolean;    // Om modellen hämtades live från API:et
  }
  ```
- [x] **1.2** Skapa `DEFAULT_GEMINI_MODELS`-listan och `DEFAULT_GEMINI_MODEL`-konstanten i `src/types/index.ts` som stabil fallback.
- [x] **1.3** Exportera alla nya typer och konstanter centralt.

---

### Steg 2: Service-funktioner för API-anrop & modellval (`src/services/aiService.ts`)
- [x] **2.1** Definiera konstanter för storage-nycklar:
  ```typescript
  export const AI_MODEL_STORAGE_KEY = 'foodhero_ai_model';
  export const AI_MODELS_CACHE_KEY = 'foodhero_gemini_models_cache';
  ```
- [x] **2.2** Implementera `fetchAvailableGeminiModels(forceRefresh?: boolean): Promise<AIModelOption[]>`:
  - Kontrollera först cache i `localStorage` (om inte `forceRefresh` är sant och TTL inte löpt ut).
  - Anropa Gemini REST API: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`.
  - Filtrera svar: `m.supportedGenerationMethods?.includes('generateContent')` och `m.name.includes('gemini')`.
  - Mappa svar till `AIModelOption[]` och spara i cache.
  - Vid fel / saknad API-nyckel: returnera `DEFAULT_GEMINI_MODELS` som trygg fallback och logga varning.
- [x] **2.3** Uppdatera `getModel(modelName?: string)`:
  - Skapa hjälparfunktion `getActiveModelId()` som läser:
    1. `localStorage.getItem(AI_MODEL_STORAGE_KEY)`
    2. `import.meta.env.VITE_GEMINI_MODEL`
    3. `DEFAULT_GEMINI_MODEL`
  - Se till att `callWithFallback` och `enrichMeal` använder aktiv modell.
- [x] **2.4** Exportera `getActiveModelId` och `fetchAvailableGeminiModels`.

---

### Steg 3: Hook för hantering av AI-inställningar (`src/hooks/useAiModelSetting.ts`)
- [x] **3.1** Skapa den anpassade hooken `src/hooks/useAiModelSetting.ts`.
- [x] **3.2** Definiera returtyp `UseAiModelSettingReturn`:
  ```typescript
  export interface UseAiModelSettingReturn {
      selectedModelId: string;
      setSelectedModelId: (id: string) => void;
      models: AIModelOption[];
      isLoading: boolean;
      isFetchingRemote: boolean;
      error: string | null;
      lastUpdated: number | null;
      refreshModels: () => Promise<void>;
  }
  ```
- [x] **3.3** Implementera laddning från cache vid mount samt automatisk initial hämtning om nätverk och API-nyckel finns.
- [x] **3.4** Hantera sparande till `localStorage` via reaktiv state och synkning.

---

### Steg 4: Språkstöd & i18n (`src/locales/sv.json` & `src/locales/en.json`)
- [x] **4.1** Lägg till översättningsnycklar i `src/locales/sv.json`:
  ```json
  "aiSettings": {
      "title": "AI-modell",
      "description": "Välj vilken Gemini-modell som används för recept och måltidsförslag.",
      "activeModel": "Aktiv modell",
      "refreshButton": "Hämta senaste modeller",
      "refreshing": "Hämtar från Google...",
      "refreshSuccess": "{{count}} modeller hämtades från Gemini API",
      "refreshError": "Kunde inte hämta modeller från Google. Använder förvalda modeller.",
      "modelChanged": "Bytte AI-modell till {{name}}",
      "cachedNotice": "Hämtad från Gemini API",
      "fallbackNotice": "Standardmodeller (offline/fallback)",
      "noApiKeyNotice": "Lägg till VITE_GEMINI_KEY för att hämta dynamiska modeller."
  }
  ```
- [x] **4.2** Lägg till motsvarande översättningsnycklar i `src/locales/en.json`:
  ```json
  "aiSettings": {
      "title": "AI Model",
      "description": "Choose which Gemini model is used for recipes and meal suggestions.",
      "activeModel": "Active model",
      "refreshButton": "Fetch latest models",
      "refreshing": "Fetching from Google...",
      "refreshSuccess": "{{count}} models fetched from Gemini API",
      "refreshError": "Could not fetch models from Google. Using default models.",
      "modelChanged": "Changed AI model to {{name}}",
      "cachedNotice": "Fetched from Gemini API",
      "fallbackNotice": "Default models (offline/fallback)",
      "noApiKeyNotice": "Add VITE_GEMINI_KEY to fetch dynamic models."
  }
  ```

---

### Steg 5: UI-komponent i Inställningar (`src/components/SettingsView.tsx`)
- [x] **5.1** Skapa eventuellt en ren och modulär delkomponent `src/components/AiModelSelector.tsx` (eller integrera snyggt direkt i `SettingsView.tsx`).
- [x] **5.2** Bygg gränssnittet:
  - Header med `Cpu`- eller `Sparkles`-ikon och sektionstitel.
  - Statusrad som visar om listan är live-hämtad från API eller fallback.
  - "Uppdatera modeller"-knapp med snurrande ikon (`RefreshCw`) vid laddning.
  - Radio-/kortlista för modellerna med markering av vald modell (`Check`-ikon).
  - Tydlig visning av modellens namn, ID och beskrivning.
- [x] **5.3** Koppla ihop med `useToast` för att visa bekräftelse när användaren byter modell eller när uppdatering lyckas.
- [x] **5.4** Säkerställ fullt stöd för mörkt läge (`dark:`-klasser) och tillgänglighet (`role="radiogroup"`, `aria-checked`).

---

### Steg 6: Enhetstester & testtäckning
- [x] **6.1** Skapa `src/hooks/useAiModelSetting.test.ts`:
  - Test: Returnerar standardmodell om inget finns i `localStorage`.
  - Test: Uppdaterar och sparar nytt modellval i `localStorage`.
  - Test: Anropar `refreshModels` och hanterar lyckad/misslyckad hämtning.
- [x] **6.2** Uppdatera `src/services/aiService.test.ts`:
  - Test: `getActiveModelId` prioriterar `localStorage` framför env-variabel och fallback.
  - Test: `fetchAvailableGeminiModels` filtrerar bort icke-generateContent-modeller.
  - Test: `fetchAvailableGeminiModels` faller tillbaka på standardlista vid API-fel/nätverksfel.
- [x] **6.3** Skapa/uppdatera komponenttest för modellväljaren.

---

### Steg 7: Kvalitetsgranskning, Validering & Versionering
- [x] **7.1** Kör full valideringssvit:
  ```bash
  npm run validate
  ```
- [x] **7.2** Säkerställ att inga `any`-typer används (passerar `npm run check-any`).
- [x] **7.3** Verifiera manuellt i webbläsaren:
  - Öppna Inställningar.
  - Testa att klicka "Hämta senaste modeller".
  - Byt modell och generera ett testrecept under "Måltider" / "Skapa med AI".
  - Verifiera i DevTools Network-fliken att rätt modell anropas.
- [x] **7.4** Uppdatera versionsnumret i `package.json` enligt SemVer:
  - **PATCH** (bakåtkompatibel förbättring av konfiguration & inställningar).
- [x] **7.5** Skapa git-commit på svenska enligt `AGENTS.md`:
  ```bash
  git commit -m "feat: lägg till dynamisk hämtning och val av AI-modeller i inställningar"
  ```

---

## Sammanfattning av berörda filer

| Fil | Typ | Beskrivning |
|---|---|---|
| `src/types/index.ts` | **Ändra** | Typdefinitioner (`AIModelOption`, `DEFAULT_GEMINI_MODELS`) |
| `src/services/aiService.ts` | **Ändra** | Dynamisk `fetchAvailableGeminiModels`, `getActiveModelId` och fallback |
| `src/hooks/useAiModelSetting.ts` | **Ny** | Custom hook för state, cache och hämtning |
| `src/hooks/useAiModelSetting.test.ts` | **Ny** | Enhetstester för hooken |
| `src/components/SettingsView.tsx` | **Ändra** | AI-modellsektion med uppdateringsknapp och radiokort |
| `src/locales/sv.json` | **Ändra** | Svenska översättningar för AI-inställningar |
| `src/locales/en.json` | **Ändra** | Engelska översättningar för AI-inställningar |
| `src/services/aiService.test.ts` | **Ändra** | Tester för dynamisk hämtning och localStorage-prioritet |
