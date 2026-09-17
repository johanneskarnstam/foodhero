# Plan 03 – Cooking Mode: Inbyggd Timer

## Mål

Lägga till en **automatisk timer-detektion** i cooking mode:
- Parsa ut tidsinformation direkt ur receptets steg-text (t.ex. "koka i 20 minuter")
- Visa en klickbar timer-knapp på steget om tid detekteras
- En aktiv timer-widget i headern som räknar ner
- Notifikation (visuell + ljud) när timern löper ut
- Stöd för multipla parallella timers (om man vill köra flera steg)

> **Förutsättning:** Plan 01 (CookingModeView) bör vara klar, men timern kan också
> byggas som en fristående hook och testas separat.

---

## Bakgrund & kontext

Receptens `instructions`-array är fri text (t.ex. `"Koka riset i 20 minuter"`).
Vi behöver parsa ut tid utan att kräva ändringar i datamodellen.

---

## Steg-för-steg implementation

### Steg 1 – Tidsparser: `parseTimerFromStep`

**Fil:** `src/utils/timerParser.ts` [NY]

En ren utility-funktion som tar en sträng och returnerar sekunder (eller null).

**Regex-regler (svenska + engelska):**

| Pattern | Exempel | Sekunder |
|---|---|---|
| `(\d+)\s*min(ut)?` | "20 min", "5 minuter" | `n * 60` |
| `(\d+)\s*tim(me)?` | "2 timmar" | `n * 3600` |
| `(\d+)\s*sek(und)?` | "30 sekunder" | `n` |
| `(\d+)\s*hour` | "1 hour" | `n * 3600` |
| `(\d+)\s*minute` | "20 minutes" | `n * 60` |
| `(\d+)\s*second` | "30 seconds" | `n` |

**Interface:**
```typescript
export interface ParsedTimer {
  seconds: number;
  label: string; // t.ex. "20 min"
}

export function parseTimerFromStep(text: string): ParsedTimer | null
```

**Exempel:**
```typescript
parseTimerFromStep("Koka riset i 20 minuter med lock")
// → { seconds: 1200, label: "20 min" }

parseTimerFromStep("Stek i 2-3 minuter per sida")
// → { seconds: 120, label: "2 min" }  (tar det lägre värdet vid intervall)

parseTimerFromStep("Tillsätt salt och rör om")
// → null
```

---

### Steg 2 – Timer Hook: `useCookingTimer`

**Fil:** `src/hooks/useCookingTimer.ts` [NY]

```typescript
interface ActiveTimer {
  id: string;        // uuid
  stepIndex: number;
  label: string;     // "20 min – Koka ris"
  totalSeconds: number;
  remainingSeconds: number;
  isPaused: boolean;
  isFinished: boolean;
}

interface UseCookingTimerReturn {
  timers: ActiveTimer[];
  startTimer: (stepIndex: number, seconds: number, label: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  cancelTimer: (id: string) => void;
}
```

**Implementationsdetaljer:**
- Använd `setInterval` (1 sekund) för att ticka ner `remainingSeconds`
- Cleanup av interval i `useEffect` return
- När `remainingSeconds === 0`: sätt `isFinished = true`, spela upp notifikations-ljud
- Stöd multipla timers via array-state

---

### Steg 3 – Integrera timer i `CookingModeView`

**Fil:** `src/components/CookingModeView.tsx` [ÄNDRA]

**Per steg-rendering:**

1. Anropa `parseTimerFromStep(step)` för varje steg
2. Om parsad timer finns → visa en timer-knapp bredvid steg-texten:

```tsx
{parsedTimer && !isStepCompleted && (
  <button
    onClick={() => startTimer(idx, parsedTimer.seconds, parsedTimer.label)}
    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-200 transition-colors"
  >
    <Timer size={12} />
    {parsedTimer.label}
  </button>
)}
```

**Timer-widget i header:**

Visa en kompakt timer-rad under headern om det finns aktiva timers:

```
┌─────────────────────────────────────────┐
│ [X] Avsluta     Pannkakor    [⛶] [☀]   │  ← Header
├─────────────────────────────────────────┤
│ ⏱ Koka ris  14:32  [Pausa] [✕]         │  ← Timer-rad (animerad)
│ ⏱ Förvärm ugn  4:58  [Pausa] [✕]       │
├─────────────────────────────────────────┤
│         (steg-vy)                       │
```

---

### Steg 4 – Notifikation när timer löper ut

**Alternativ A – Visuell:**
- Flasha timern röd + visa ett toast-meddelande med stegets namn

**Alternativ B – Ljud:**
- Spela upp ett enkelt pip-ljud via `AudioContext` API (inget externt ljud-bibliotek):

```typescript
const playBeep = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
};
```

**Alternativ C – Web Notifications API:**
- Fråga om tillstånd vid start av cooking mode
- Skicka systemnotifikation om appen är i bakgrunden

**Rekommendation:** Implementera A + B som standard. C är opt-in (om wakeLock är aktivt är appen ändå i förgrunden).

---

### Steg 5 – i18n-nycklar

Lägg till under befintliga `cookingMode`-nycklar:

```json
// sv.json
"timer": "Timer",
"timerStart": "Starta timer",
"timerPause": "Pausa",
"timerResume": "Fortsätt",
"timerCancel": "Avbryt timer",
"timerDone": "{{label}} – klar!",
"timerRunning": "Timers aktiva"

// en.json
"timer": "Timer",
"timerStart": "Start timer",
"timerPause": "Pause",
"timerResume": "Resume",
"timerCancel": "Cancel timer",
"timerDone": "{{label}} – done!",
"timerRunning": "Active timers"
```

---

### Steg 6 – Tester

**Fil:** `src/utils/timerParser.test.ts` [NY]
- Parser returnerar korrekt antal sekunder för svenska och engelska mönster
- Parser returnerar `null` för text utan tidsuppgift
- Intervall-tider (2-3 min) returnerar det lägre värdet

**Fil:** `src/hooks/useCookingTimer.test.ts` [NY]
- `startTimer` lägger till en timer i listan
- Timern räknar ner (mocka `setInterval`)
- `cancelTimer` tar bort timern från listan
- `isFinished` sätts när `remainingSeconds === 0`

---

## Filer som berörs

| Fil | Åtgärd |
|---|---|
| `src/utils/timerParser.ts` | **[NY]** Regex-parser för tidsuttryck |
| `src/utils/timerParser.test.ts` | **[NY]** Enhetstester för parsern |
| `src/hooks/useCookingTimer.ts` | **[NY]** Timer-logik och state |
| `src/hooks/useCookingTimer.test.ts` | **[NY]** Enhetstester för hooken |
| `src/components/CookingModeView.tsx` | **[ÄNDRA]** Visa timer-knappar + widget |
| `src/locales/sv.json` | **[ÄNDRA]** Timer-nycklar |
| `src/locales/en.json` | **[ÄNDRA]** Timer-nycklar |

---

## Designbeslut att besluta om

1. **Multipla timers** – Ska användaren kunna ha fler än 1 aktiv timer?
   - Rekommendation: **Ja**, max 3 st (de flesta recept har inte mer)

2. **Timer-ljud** – AudioContext eller tyst?
   - Rekommendation: **AudioContext med liten beep**, volymstyrd via `gain`

3. **Intervall-tider** – "2-3 minuter" → ta lägre, högre, eller visa båda?
   - Rekommendation: **Ta det lägre värdet** och skriv "(min)" i label

---

## Beroenden

- `timerParser.ts` är fristående och kan implementeras direkt
- `useCookingTimer.ts` är fristående
- Integration i `CookingModeView.tsx` kräver Plan 01

---

## Valideringssteg

```bash
npm run validate
```

Versionsökning: Ingår i samma MINOR-bump som Plan 01 och 02
