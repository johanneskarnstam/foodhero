# Planerade implementationer – FoodHero

## Cooking Mode

| Plan | Fil | Innehåll | Prioritet |
|---|---|---|---|
| 01 | `01-cooking-mode-core.md` | Kärna: steg-bockning + ingredienspanel | 🔴 Hög (grund) |
| 02 | `02-cooking-mode-fullscreen-wakelock.md` | Fullscreen + WakeLock | 🟡 Medel |
| 03 | `03-cooking-mode-timer.md` | Auto-timer från steg-text | 🟡 Medel |

## AI-inställningar

| Plan | Fil | Innehåll | Prioritet |
|---|---|---|---|
| 04 | `04-ai-model-selector.md` | Dynamisk AI-modellista via Gemini API & val i Inställningar | 🟡 Medel |

## Bildhantering

| Plan | Fil | Innehåll | Prioritet |
|---|---|---|---|
| 05 | `05-recipe-image-fetching.md` | Automatisk bildshämtning för recept via Unsplash/Pexels | 🟡 Medel |

## AI-hjälp i recept

| Plan | Fil | Innehåll | Prioritet |
|---|---|---|---|
| 06 | `06-recipe-ai-help.md` | Ställ kontextmedvetna frågor till AI inne på ett recept | 🟡 Medel |

---

## Cooking Mode – implementationsordning

```
Plan 01 (Kärna: CookingModeView)
    │
    ├── Plan 02 (Fullscreen + WakeLock)   ← parallell med 03
    └── Plan 03 (Timer)                   ← parallell med 02
```

## AI Model Selector – implementationsordning

```
Plan 04 (oberoende – kan köras när som helst)
```

## Bildshämtning – implementationsordning

```
Plan 05 (oberoende – kan köras när som helst)
```

## AI-hjälp i recept – implementationsordning

```
Plan 06 (bygger på befintlig AI-tjänst och kan köras parallellt med Plan 04)
```

---

## Sammanfattning av nya filer

```
src/
├── components/
│   └── CookingModeView.tsx          [NY – Plan 01]
│   └── CookingModeView.test.tsx     [NY – Plan 01]
│   ├── RecipeImageSearchModal.tsx   [NY – Plan 05]
│   ├── RecipeImageSearchModal.test.tsx [NY – Plan 05]
│   ├── RecipeAiHelpModal.tsx        [NY – Plan 06]
│   └── RecipeAiHelpModal.test.tsx   [NY – Plan 06]
├── hooks/
│   ├── useFullscreen.ts             [NY – Plan 02]
│   ├── useFullscreen.test.ts        [NY – Plan 02]
│   ├── useCookingTimer.ts           [NY – Plan 03]
│   ├── useCookingTimer.test.ts      [NY – Plan 03]
│   ├── useAiModelSetting.ts         [NY – Plan 04]
│   ├── useAiModelSetting.test.ts    [NY – Plan 04]
│   ├── useRecipeAiHelp.ts           [NY – Plan 06]
│   └── useRecipeAiHelp.test.ts      [NY – Plan 06]
├── services/
│   ├── imageService.ts              [NY – Plan 05]
│   └── imageService.test.ts         [NY – Plan 05]
└── utils/
    ├── timerParser.ts               [NY – Plan 03]
    └── timerParser.test.ts          [NY – Plan 03]
```

## Modifierade filer

| Fil | Plan(er) | Ändring |
|---|---|---|
| `MealDetailModal.tsx` | 01 | `onCook`-prop + "Laga nu"-knapp |
| `MealsView.tsx` | 01 | State för cooking mode |
| `CookingModeView.tsx` | 02, 03 | Fullscreen + timer-integration |
| `types/index.ts` | 04 | `AIModelOption`, `AVAILABLE_GEMINI_MODELS` |
| `services/aiService.ts` | 04, 05, 06 | Läsa modell från localStorage, bildshämtning och receptfrågor |
| `services/aiService.test.ts` | 04, 05 | Tester för localStorage-läsning + bildshämtning |
| `SettingsView.tsx` | 04 | Radio-knapplista för modellval |
| `AiRecipeModal.tsx` | 05 | Visa bild i förhandsvisning + "Byt bild"-knapp |
| `MealEditModal.tsx` | 05 | Visa bild + "Ta bort bild" + "Sök bild"-knappar |
| `MealDetailModal.tsx` | 06 | Knapp för att öppna AI-hjälp om receptet |
| `locales/sv.json` | 01, 03, 04, 05, 06 | Nya i18n-nycklar |
| `locales/en.json` | 01, 03, 04, 05, 06 | Nya i18n-nycklar |

## Versionsökning

- Plan 01+02+03: **MINOR** (ny cooking mode-funktion)
- Plan 04: **PATCH** (konfigurerbarhet, inga nya kärnfunktioner)
- Plan 05: **MINOR** (ny bildshämtningsfunktion)
- Plan 06: **MINOR** (ny AI-hjälpfunktion inne på recept)
