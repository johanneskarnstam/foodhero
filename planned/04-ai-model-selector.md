# Plan 04 – AI-modellväljare: Dropdown i Inställningar

## Mål

Låta användaren välja vilken Gemini-modell som används för receptgenerering
via en tydlig dropdown i inställningsvyn. Valet sparas i `localStorage` och
används direkt av `aiService.ts` utan omstart.

---

## Bakgrund & kontext

Idag hämtas modellen via `import.meta.env.VITE_GEMINI_MODEL` med fallback
till en hårdkodad sträng i `getModel()` (rad 82 i `aiService.ts`):

```typescript
// src/services/aiService.ts – nuläge
function getModel() {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
    return genAI.getGenerativeModel({ model: modelName, ... });
}
```

Det finns ingen användargränssnitt för att byta modell. Den nya lösningen
ska göra modellvalet runtime-konfigurerbart via UI utan att ändra env-variabler.

Befintliga relevanta filer:
- `src/services/aiService.ts` – `getModel()`-funktionen
- `src/components/SettingsView.tsx` – inställningssidan (51 KB, stor fil)
- `src/hooks/useLocalStorage.ts` – generell `useLocalStorage`-hook
- `src/types/index.ts` – centraliserade typdefinitioner
- `src/locales/sv.json` & `en.json` – i18n-filer

---

## Steg-för-steg implementation

### Steg 1 – Typdefinition i `src/types/index.ts`

**Fil:** `src/types/index.ts` [ÄNDRA]

Lägg till interface och konstant-lista längst ned i filen:

```typescript
export interface AIModelOption {
    id: string;
    name: string;
    description: string;
}

export const AVAILABLE_GEMINI_MODELS: AIModelOption[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Snabb & stabil' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Nyast & smartast' },
    { id: 'gemini-2.5-pro',   name: 'Gemini 2.5 Pro',   description: 'Hög precision'   },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
```

**Varför i `types/index.ts`?** Konstanten används av både `aiService.ts` och
`SettingsView.tsx` – en gemensam källa undviker duplicering.

---

### Steg 2 – localStorage-nyckel & läsning i `aiService.ts`

**Fil:** `src/services/aiService.ts` [ÄNDRA]

Ersätt `getModel()` med en version som läser från `localStorage` i runtime:

```typescript
import { DEFAULT_GEMINI_MODEL } from '../types';

const AI_MODEL_STORAGE_KEY = 'foodhero_ai_model';

function getSelectedModelId(): string {
    try {
        const stored = window.localStorage.getItem(AI_MODEL_STORAGE_KEY);
        return stored ?? import.meta.env.VITE_GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    } catch {
        return import.meta.env.VITE_GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    }
}

function getModel() {
    const modelName = getSelectedModelId();
    return genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION });
}
```

**Prioritetsordning:**
1. `localStorage['foodhero_ai_model']` (användarens val)
2. `VITE_GEMINI_MODEL` (env-variabel för driftsättning)
3. `DEFAULT_GEMINI_MODEL` (hårdkodad fallback = `'gemini-2.5-flash'`)

**Konstanten `AI_MODEL_STORAGE_KEY`** exporteras för att undvika magic strings:

```typescript
export const AI_MODEL_STORAGE_KEY = 'foodhero_ai_model';
```

---

### Steg 3 – Hook: `useAiModelSetting`

**Fil:** `src/hooks/useAiModelSetting.ts` [NY]

En tunn hook som wrappar `useLocalStorage` med rätt nyckel och typ:

```typescript
import useLocalStorage from './useLocalStorage';
import { AI_MODEL_STORAGE_KEY } from '../services/aiService';
import { AVAILABLE_GEMINI_MODELS, DEFAULT_GEMINI_MODEL, AIModelOption } from '../types';

export interface UseAiModelSettingReturn {
    selectedModelId: string;
    selectedModel: AIModelOption | undefined;
    setModelId: (id: string) => void;
    availableModels: AIModelOption[];
}

export function useAiModelSetting(): UseAiModelSettingReturn {
    const [selectedModelId, setModelId] = useLocalStorage<string>(
        AI_MODEL_STORAGE_KEY,
        DEFAULT_GEMINI_MODEL
    );

    const selectedModel = AVAILABLE_GEMINI_MODELS.find(m => m.id === selectedModelId);

    return {
        selectedModelId,
        selectedModel,
        setModelId,
        availableModels: AVAILABLE_GEMINI_MODELS,
    };
}
```

---

### Steg 4 – UI-komponent i `SettingsView.tsx`

**Fil:** `src/components/SettingsView.tsx` [ÄNDRA]

Lägg till ett nytt AI-inställnings-avsnitt. Hitta rätt plats: sök efter det
befintliga AI/Gemini-avsnittet (om sådant finns) eller lägg till efter
API-nyckel-sektionen.

**Markup för dropdown-sektionen:**

```tsx
import { useAiModelSetting } from '../hooks/useAiModelSetting';
import { Cpu } from 'lucide-react';

// Inuti komponenten:
const { selectedModelId, setModelId, availableModels } = useAiModelSetting();

// JSX:
<section aria-labelledby="ai-model-heading">
  <h3 id="ai-model-heading" className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
    <Cpu size={14} />
    {t('settings.aiModel', 'AI-modell')}
  </h3>

  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
    {availableModels.map((model) => (
      <button
        key={model.id}
        id={`ai-model-option-${model.id}`}
        type="button"
        role="radio"
        aria-checked={selectedModelId === model.id}
        onClick={() => setModelId(model.id)}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors',
          selectedModelId === model.id
            ? 'bg-blue-50 dark:bg-blue-950/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
        )}
      >
        <div>
          <p className={clsx(
            'text-sm font-semibold',
            selectedModelId === model.id
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-gray-100'
          )}>
            {model.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {model.description}
          </p>
        </div>
        {selectedModelId === model.id && (
          <Check size={16} className="text-blue-500 flex-shrink-0" />
        )}
      </button>
    ))}
  </div>
</section>
```

**Designbeslut:** Radio-liknande knapplista (inte `<select>`) för att:
- Visa namn + beskrivning för varje alternativ
- Vara mer touchvänlig på mobil
- Passa den befintliga kortbaserade designen i SettingsView

---

### Steg 5 – i18n-nycklar

**Filer:** `src/locales/sv.json` & `src/locales/en.json` [ÄNDRA]

```json
// sv.json – lägg till under "settings" (eller skapa nytt nyckelblock)
"aiModel": "AI-modell",
"aiModelDescription": "Välj vilken Gemini-modell som används för receptgenerering.",
"aiModelChanged": "AI-modell ändrad till {{name}}"

// en.json
"aiModel": "AI model",
"aiModelDescription": "Choose which Gemini model is used for recipe generation.",
"aiModelChanged": "AI model changed to {{name}}"
```

---

### Steg 6 – Toast-bekräftelse vid modellbyte

I SettingsView, lägg till ett toast-meddelande när modellen byts:

```typescript
const handleModelChange = (id: string) => {
    const model = availableModels.find(m => m.id === id);
    setModelId(id);
    if (model) {
        showToast(t('settings.aiModelChanged', 'AI-modell ändrad till {{name}}', { name: model.name }));
    }
};
```

---

### Steg 7 – Tester

**Fil:** `src/hooks/useAiModelSetting.test.ts` [NY]

```typescript
// Tester:
it('ska returnera DEFAULT_GEMINI_MODEL som standard')
it('ska spara valt modell-id i localStorage')
it('ska returnera rätt AIModelOption-objekt för valt id')
it('ska returnera undefined selectedModel om lagrat id inte matchar kända modeller')
```

**Fil:** `src/services/aiService.test.ts` [ÄNDRA]

Lägg till test som verifierar att `getSelectedModelId()` läser från
`localStorage` och faller tillbaka korrekt:

```typescript
it('ska använda modell från localStorage om den finns')
it('ska falla tillbaka till env-variabel om localStorage saknar värde')
it('ska falla tillbaka till DEFAULT_GEMINI_MODEL om inget är konfigurerat')
```

---

## Sammanfattning – filer som berörs

| Fil | Åtgärd | Detalj |
|---|---|---|
| `src/types/index.ts` | **[ÄNDRA]** | `AIModelOption`, `AVAILABLE_GEMINI_MODELS`, `DEFAULT_GEMINI_MODEL` |
| `src/services/aiService.ts` | **[ÄNDRA]** | `getSelectedModelId()`, exportera `AI_MODEL_STORAGE_KEY` |
| `src/hooks/useAiModelSetting.ts` | **[NY]** | Tunn hook för modellval |
| `src/hooks/useAiModelSetting.test.ts` | **[NY]** | Enhetstester |
| `src/components/SettingsView.tsx` | **[ÄNDRA]** | UI-sektion med radio-knapplista |
| `src/services/aiService.test.ts` | **[ÄNDRA]** | Tester för localStorage-läsning |
| `src/locales/sv.json` | **[ÄNDRA]** | `settings.aiModel*`-nycklar |
| `src/locales/en.json` | **[ÄNDRA]** | `settings.aiModel*`-nycklar |

---

## Designbeslut att bekräfta

1. **Radio-lista vs `<select>`** – Planen använder knapplista.
   Byt till `<select>` om SettingsView redan är för tät.

2. **Modell-lista i `types/index.ts`** – Alternativt kan den ligga i
   `services/aiService.ts`. Valt types för att undvika cirkulärberoenden.

3. **Ingen server-validering** – Modell-id:t skickas rakt till Google API.
   Om ett ogiltigt id anges misslyckas nästa API-anrop med ett tydligt felmeddelande.

---

## Beroenden

Ingen beroende till planerna 01–03. Kan implementeras helt oberoende.

---

## Valideringssteg

```bash
npm run validate
```

Versionsökning: **PATCH** (förbättrad konfigurerbarhet, ingen ny kärnfunktion)
