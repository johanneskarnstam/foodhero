# Plan 02 – Cooking Mode: Fullscreen & WakeLock

## Mål

Utöka `CookingModeView` (skapad i Plan 01) med:
- Fullscreen API-stöd (enter/exit fullscreen)
- WakeLock (skärmen slocknar inte under tillagning)
- Visuell indikator för aktiva lägen (fullscreen/wakelock)

> **Förutsättning:** Plan 01 måste vara implementerad och validerad innan detta.

---

## Bakgrund & kontext

`useWakeLock.ts` finns redan i `src/hooks/` och är produktionsklar.
Fullscreen API är nativt i alla moderna webbläsare men kräver en wrapper-hook.

---

## Steg-för-steg implementation

### Steg 1 – Ny hook: `useFullscreen`

**Fil:** `src/hooks/useFullscreen.ts` [NY]

```typescript
import { useState, useCallback, useRef } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = useCallback(async () => {
    const el = elementRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) return exitFullscreen();
    return enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Synka state med webbläsarens FSchange-event
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen, elementRef };
};
```

---

### Steg 2 – Integrera i `CookingModeView`

**Fil:** `src/components/CookingModeView.tsx` [ÄNDRA]

Importera och använd både `useFullscreen` och befintliga `useWakeLock`:

```typescript
const { isFullscreen, toggleFullscreen, elementRef } = useFullscreen();
const { isLocked, isSupported: wakeLockSupported, requestWakeLock, releaseWakeLock } = useWakeLock();
```

**Auto-beteende:**
- När `CookingModeView` monteras → anropa `requestWakeLock()` automatiskt
- När `CookingModeView` avmonteras → anropa `releaseWakeLock()` automatiskt
- Fullscreen-knapp i headern aktiveras/avaktiveras manuellt av användaren

```typescript
// Auto-wakelock
useEffect(() => {
  requestWakeLock();
  return () => { releaseWakeLock(); };
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Header-knappar:**

| Knapp | Ikon | Funktion |
|---|---|---|
| Avsluta | `X` | Stänger cooking mode (+ exit fullscreen + release wakelock) |
| Fullscreen | `Maximize2` / `Minimize2` | Togglar fullscreen |
| WakeLock-indikator | `Sun` / `SunDim` | Visar om skärmen hålls vaken (readonly) |

---

### Steg 3 – UX-anpassningar för fullscreen

I fullscreen-läge:
- Dölj webbläsarens chrome → `document.body` padding justeras inte (hanteras av Fullscreen API)
- Bakgrundsfärg på `elementRef`-elementet sätts till `bg-gray-950` för mörkt läge och `bg-white` för ljust läge
- Header förblir synlig och sticky
- Ingredient-panelen förblir sticky i botten

**CSS-klass på root-elementet:**
```tsx
<div
  ref={elementRef}
  className={clsx(
    'fixed inset-0 z-[200] flex flex-col',
    'bg-white dark:bg-gray-950',
    isFullscreen && 'fullscreen-mode'
  )}
>
```

---

### Steg 4 – Fallback för miljöer utan stöd

- Om `document.fullscreenElement === undefined` → dölj fullscreen-knappen
- Om `!wakeLockSupported` → dölj wakelock-indikatorn (men visa ändå ett toastvarnande)

---

### Steg 5 – Hook-tester

**Fil:** `src/hooks/useFullscreen.test.ts` [NY]

- `enterFullscreen` anropar `requestFullscreen` på elementet
- `exitFullscreen` anropar `document.exitFullscreen`
- `fullscreenchange`-event uppdaterar `isFullscreen`-state
- Cleanup tar bort event listeners

---

## Filer som berörs

| Fil | Åtgärd |
|---|---|
| `src/hooks/useFullscreen.ts` | **[NY]** Fullscreen API-wrapper |
| `src/hooks/useFullscreen.test.ts` | **[NY]** Enhetstester |
| `src/components/CookingModeView.tsx` | **[ÄNDRA]** Integrera fullscreen + wakelock |

---

## Beroenden

- Kräver **Plan 01** vara klar
- **Plan 03** (Timer) är oberoende och kan implementeras parallellt

---

## Valideringssteg

```bash
npm run validate
```

Versionsökning: Ingår i samma MINOR-bump som Plan 01
