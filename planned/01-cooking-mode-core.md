# Plan 01 – Cooking Mode: Kärna & Steg-bockning

## Mål

Skapa en dedikerad **"Laga nu"-vy** för ett recept där användaren kan:
- Se recept i ett fokuserat fullscreen-läge
- Bocka av varje tillagningssteg (instructions) ett i taget
- Se en kompakt ingrediensflik (alltid synlig / fixerad nere)
- Stänga läget och återgå till det vanliga receptkortet

---

## Bakgrund & kontext

Idag visar `MealDetailModal` ingredients och instructions i en tabbar-vy inuti en modal.
Det saknas ett dedikerat "laga nu"-läge med progress-spårning och fullscreen-UX.

Befintliga relevanta filer:
- `src/components/MealDetailModal.tsx` – nuvarande receptvisning
- `src/components/RecipeDetailModal.tsx` – tunn wrapper runt `MealDetailModal`
- `src/types/index.ts` – `Meal`-interfacet (instructions: string[], ingredients[])
- `src/hooks/useWakeLock.ts` – redan implementerad WakeLock-hook

---

## Steg-för-steg implementation

### Steg 1 – Ny komponent: `CookingModeView`

**Fil:** `src/components/CookingModeView.tsx` [NY]

En fullscreen-overlay-komponent (z-index över allt annat) som tar en `meal: Meal`-prop.

**Layout-struktur:**
```
┌─────────────────────────────────┐
│ [X] Avsluta    "Pannkakor"  [⏵] │  ← Header (fast, 56px)
├─────────────────────────────────┤
│                                 │
│   STEG-VY (scrollbar, flex-1)  │
│   ┌───────────────────────────┐ │
│   │ ● Steg 1 av 5            │ │
│   │   Koka upp vatten...      │ │  ← Aktivt steg, framhävt
│   └───────────────────────────┘ │
│   ┌───────────────────────────┐ │
│   │ ✓ Steg 2                  │ │  ← Avbockat steg (tonat ner)
│   └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ INGREDIENSER (kollapsbar nere)  │  ← Alltid synlig flik
│ • 200g mjöl  • 3 ägg  • ...    │
└─────────────────────────────────┘
```

**State:**
```typescript
const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
const [ingredientsPanelOpen, setIngredientsPanelOpen] = useState(false);
```

**Stegbockning:**
- Klick på ett steg → togglar det i `completedSteps`-setet
- Avbockade steg visas med `line-through`, `opacity-40`, och en grön bock-ikon
- Aktivt/nästa steg är framhävt med en ring/accent-färg
- Progress-bar längs med toppen (completedSteps.size / instructions.length)

---

### Steg 2 – Typ-utökning i `src/types/index.ts`

Inga ändringar av `Meal`-interfacet behövs – instructions och ingredients finns redan.

---

### Steg 3 – Koppla "Laga nu"-knapp i `MealDetailModal`

**Fil:** `src/components/MealDetailModal.tsx` [ÄNDRA]

Lägg till en ny "Laga nu" (ChefHat-ikon)-knapp i Action Footer, synlig om `hasInstructions`.

```typescript
// Ny prop
onCook?: (meal: Meal) => void;
```

Knappen renderas bredvid "Planera"-knappen.

---

### Steg 4 – State-hantering i `MealsView`

**Fil:** `src/components/MealsView.tsx` [ÄNDRA]

```typescript
const [cookingMeal, setCookingMeal] = useState<Meal | null>(null);
```

- Sätt `cookingMeal` när `onCook` anropas
- Rendera `<CookingModeView meal={cookingMeal} onClose={() => setCookingMeal(null)} />` när den är satt

---

### Steg 5 – Ingredienspanel (fast botten)

Ingredienspanelen är en **kollapsbar sheet** i botten av `CookingModeView`:

- En handtag-indikator (pill) högst upp i panelen
- Standardläge: **kollapsad** (visar bara flikhuvudet "Ingredienser (6)")
- Expanderad: visar hela listan som en horisontell scroll-lista eller kompakt tabell
- Stöder swipe-up-gesture (valfritt, kan läggas till senare)

---

### Steg 6 – i18n-nycklar

**Filer:** `src/locales/sv.json` & `src/locales/en.json` [ÄNDRA]

Nya nycklar under `cookingMode`:
```json
{
  "startCooking": "Laga nu",
  "exitCooking": "Avsluta",
  "step": "Steg",
  "of": "av",
  "ingredientsPanel": "Ingredienser",
  "allDone": "Recept klart! 🎉",
  "progressLabel": "{{done}} av {{total}} steg klara"
}
```

---

### Steg 7 – Tester

**Fil:** `src/components/CookingModeView.test.tsx` [NY]

- Renderar steg korrekt från `meal.instructions`
- Bocka av steg → klassändringar appliceras
- Bocka av alla steg → "klart"-meddelande visas
- Ingredienspanel är kollapsad som standard
- Ingredienspanel expanderar vid klick

---

## Filer som berörs

| Fil | Åtgärd |
|---|---|
| `src/components/CookingModeView.tsx` | **[NY]** Kärna i planen |
| `src/components/CookingModeView.test.tsx` | **[NY]** Enhetstester |
| `src/components/MealDetailModal.tsx` | **[ÄNDRA]** Lägg till `onCook`-prop + knapp |
| `src/components/MealsView.tsx` | **[ÄNDRA]** State + rendera `CookingModeView` |
| `src/locales/sv.json` | **[ÄNDRA]** Nya i18n-nycklar |
| `src/locales/en.json` | **[ÄNDRA]** Nya i18n-nycklar |

---

## Beroenden till andra planer

- **Plan 02** (Fullscreen + WakeLock) bygger ovanpå denna komponent
- **Plan 03** (Timer) bygger ovanpå denna komponent

---

## Valideringssteg

```bash
npm run validate
```

Versionsökning: **MINOR** (ny funktion)
