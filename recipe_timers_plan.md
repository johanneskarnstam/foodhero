# Implementation Plan - Recepttimers i instruktioner

Implementera automatisk tidsidentifiering i tillagningssteg med interaktiva nedräkningstimers, stöd för flera parallella timers och en flytande statusrad i `MealDetailModal`.

## Användarens specifikation & val
1. **Placering:** Direkt i det berörda instruktionssteget + en flytande/fäst timer-rad i modalen så att man ser nedräkningen oavsett var man scrollar eller om man byter till ingrediensfliken.
2. **Flera aktiva timers:** Ja, man ska kunna köra flera timers parallellt (t.ex. ris 15 min och sås 5 min).
3. **Trigger:** Endast automatiskt identifierade tider i stegen (ingen separat tom manuell timer).

---

## Föreslagen Arkitektur & Komponenter

### 1. Utility: Tidsdetektering (`src/utils/timerUtils.ts`)
- Regex-baserad parser som detekterar tidsangivelser i recepttext på både svenska och engelska:
  - Minuter: `15 min`, `15 minuter`, `10-15 minuter`, `15 mins`, `15m` (vid intervall t.ex. 10-15 min kan övre gräns väljas som standard med möjlighet till justering).
  - Timmar: `1 timme`, `2 timmar`, `1.5 timmar`, `1 h`, `1 hour`, `2 hours`.
  - Sekunder: `30 sek`, `45 sekunder`, `30 seconds`, `30s`.
  - Kombinationer: `1 timme och 30 minuter`, `1 h 20 min`.
- Hjälpfunktioner:
  - `parseStepTimers(text: string)`: Returnerar lista med `{ durationSeconds: number; label: string }`.
  - `formatRemainingTime(seconds: number)`: Formaterar sekunder till `MM:SS` eller `H:MM:SS`.

### 2. Hook / Tillståndshantering (`src/hooks/useRecipeTimers.ts`)
- Hanterar array av aktiva timers:
  ```ts
  interface RecipeTimer {
    id: string;
    stepIndex: number;
    stepNumber: number;
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
    isRunning: boolean;
    isFinished: boolean;
  }
  ```
- Funktioner:
  - `startOrAddTimer(stepIndex: number, stepNumber: number, durationSeconds: number, label: string)`
  - `toggleTimer(timerId: string)`
  - `resetTimer(timerId: string)`
  - `removeTimer(timerId: string)`
  - `adjustTimer(timerId: string, deltaSeconds: number)` (t.ex. +1 min)
- Ljudsignal & vibration:
  - Vid avslut (`remainingSeconds === 0`): Spelar ett mjukt bekräftande ljud via Web Audio API (cross-browser, inga externa ljudfiler krävs) samt `navigator.vibrate?.([200, 100, 200])`.

### 3. UI-komponenter & Integration
- **I instruktionssteget (`MealDetailModal.tsx`):**
  - Texten renderar interaktiva timer-chips/knappar för identifierade tider (t.ex. `⏱️ 15 min`).
  - Om en timer redan körs för det steget visas status direkt i steget.
- **Flytande timer-rad (`src/components/RecipeTimerBar.tsx`):**
  - Monteras i `MealDetailModal` ovanför bottenknapparna.
  - Visas så länge minst en timer är skapad/aktiv/klar.
  - Visar tidsnedräkning, paus/start, återställ och stäng för respektive timer.
  - Vid avslutad timer: Tydlig pulserande grön/bärnstensfärgad indikator med "Klar!".

### 4. Internationalisering (i18n)
Uppdatera både `src/locales/sv.json` och `src/locales/en.json` med relevanta nycklar:
- `timer.start` ("Starta timer"), `timer.pause` ("Pausa"), `timer.resume` ("Återuppta"), `timer.reset` ("Återställ"), `timer.done` ("Tiden är ute!"), `timer.step` ("Steg {{step}}"), `timer.addMinute` ("+1 min").

---

## Verifieringsplan

### Enhetstester
- `src/utils/timerUtils.test.ts`: Testa regex och parser för olika svenska och engelska tidsmönster (minuter, timmar, intervall, sekunder).
- `src/hooks/useRecipeTimers.test.ts` (eller komponenttest i `MealDetailModal.test.tsx` / `RecipeTimerBar.test.tsx`):
  - Testa start, paus, justera och ta bort timer.
  - Testa att flera timers kan ticka parallellt.
- Köra `npm run validate` för lint, types och alla tester.

### Versionshantering & Git
1. `git checkout -b feature/recipe-step-timers`
2. Implementera koden och testerna.
3. Verifiera `npm run validate`.
4. Bumpa version i `package.json` (`1.17.1` -> `1.18.0`, MINOR feature).
5. Committa på svenska och pusha branch.
6. Verifiera GitLab CI.
7. Merga till `main` och städa feature-branchen.
