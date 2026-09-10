# Implementationsplan: AI-genererade Recept med Gemini

> **Status: ✅ KLAR** — Mergad till `main` 2026-09-10, version `1.8.0`

## Bakgrund & Syfte

Appen har redan stöd för att skapa och spara måltider (`Meal`) med ingredienser, instruktioner och taggar i Firestore. I `src_looplist/services/aiService.ts` finns ett fungerande mönster för att anropa Gemini API:et via `@google/generative-ai`.

Syftet med denna funktion är att låta användaren:
1. **Generera ett nytt recept** — skriva en prompt (t.ex. "Ge mig ett recept på laxpasta för 4 personer") och få tillbaka ett komplett recept som direkt kan sparas i appen.
2. **Komplettera ett befintligt recept** — om en måltid saknar ingredienser eller instruktioner, kan användaren klicka på en "Fyll i med AI"-knapp inne i redigeringsmodalen för att låta Gemini fylla i det som saknas.

---

## Scope & Avgränsningar

- **Ingår:** AI-service, ny hook, UI i `MealEditModal` samt nytt entry point i `MealsView`.
- **Ingår inte:** Bildgenerering, automatisk inköpslistegenerering (redan löst separat), ändringar av Firestore-schema (befintligt `Meal`-interface räcker).

---

## Förutsättningar

### Ny dependency ✅

`@google/generative-ai` installerad via `npm install @google/generative-ai`.

### Miljövariabel ✅

`VITE_GEMINI_KEY` finns redan i `.env` — inget nytt behövdes.

---

## Datamodell

`Meal`-typen i `src/types/index.ts` var redan tillräcklig. Inga schemaändringar behövdes.

---

## Genomförda ändringar

---

### ✅ 1. Ny service: `src/services/aiService.ts`

Implementerad med `generateRecipe(prompt)` och `enrichMeal(meal)`. Inkluderar:
- JSON-extraktion från markdown-kodblock
- Strukturvalidering av AI-svar
- Användarvänlig felhantering på svenska (nätverksfel, quota, säkerhet, ogiltig nyckel)
- Modell styrs via `VITE_GEMINI_MODEL` (standard: `gemini-2.0-flash`)

**Tester:** `src/services/aiService.test.ts` — 14 tester ✅

---

### ✅ 2. Ny hook: `src/hooks/useAiRecipe.ts`

Exponerar `generateRecipe`, `enrichMeal` och `clearError`. Hanterar `isLoading` och `error` internt. Returnerar `null` vid fel istället för att kasta undantag — komponenter behöver ingen try/catch.

**Tester:** `src/hooks/useAiRecipe.test.ts` — 11 tester ✅

---

### ✅ 3. Ny komponent: `src/components/AiRecipeModal.tsx`

Modal för att **generera nytt recept från scratch**. Triggas från `MealsView`.

**UI-flöde:**
1. Textfält med placeholder-exempel
2. Knapp "Generera" → spinner under anrop
3. Förhandsvisning: namn, beskrivning, portioner, taggar, ingredienser, instruktioner
4. Knappar: **"Spara recept"** | **"Generera igen"** | **"Avbryt"**

**Tester:** `src/components/AiRecipeModal.test.tsx` — 15 tester ✅

---

### ✅ 4. Ändring: `src/components/MealEditModal.tsx`

Lade till **"Fyll i med AI"**-knapp (lila) på:
- **Ingrediensfliken** — visas i det tomma tillståndet om receptet har ett namn
- **Instruktionsfliken** — visas i rubrikraden om listan är tom och receptet har ett namn

Fyller bara i det som saknas — befintligt innehåll skrivs inte över.

---

### ✅ 5. Ändring: `src/components/MealsView.tsx`

Lade till **"Skapa med AI"**-knapp (lila) i header-sektionen, ovanför den befintliga "Skapa recept"-knappen. Öppnar `AiRecipeModal` och sparar via `handleSaveAiRecipe`.

---

### ✅ 6. Översättningar: `src/locales/sv.json` + `src/locales/en.json`

16 nycklar tillagda under `"ai"`-namnrymden i båda filerna, inkl. `generateRecipe`, `enrichWithAi`, `generating`, `enriching`, `saveRecipe`, `regenerate` m.fl.

---

### ✅ 7. Tester

| Fil | Tester | Status |
|---|---|---|
| `src/services/aiService.test.ts` | 14 | ✅ |
| `src/hooks/useAiRecipe.test.ts` | 11 | ✅ |
| `src/components/AiRecipeModal.test.tsx` | 15 | ✅ |

**Totalt 418 tester passerar.**

---

### ✅ Buggfix (hittades under arbetet)

`src/setupTests.ts` — `writeBatch` saknades i Firebase-mocken → 4 pre-existing testfel i `src_looplist` fixades.

---

## Flödesdiagram

```
MealsView
├── [Ny måltid] → MealEditModal (befintlig)
│   └── [Fyll i med AI] → enrichMeal() → populerar formuläret
└── [Skapa med AI] → AiRecipeModal (ny)
    ├── Textprompt → generateRecipe() → Gemini API
    ├── Förhandsvisning
    └── [Spara] → addMeal() → Firestore
```

---

## Verifieringsplan

### Automatiserade tester ✅
```
npm run validate → 418 tester passerar, lint OK, build OK
```

### Manuell verifiering (att göra)
1. Klicka "Skapa med AI" i måltidsvyn → modal öppnas.
2. Skriv en prompt → klicka "Generera" → recept visas i förhandsvisning.
3. Klicka "Spara" → måltiden dyker upp i listan och är sparad i Firestore.
4. Öppna en befintlig måltid utan ingredienser i redigeringsmodalen → "Fyll i med AI"-knapp visas.
5. Klicka "Fyll i med AI" → ingredienser och instruktioner fylls i automatiskt.
6. Testa med ogiltig API-nyckel → tydligt felmeddelande visas.

---

## Versionshantering ✅

`1.7.3` → `1.8.0` (MINOR — ny funktionalitet)
