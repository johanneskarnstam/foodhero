# What's New Modal — Implementation Plan

## Overview

En modal som visas vid appstart om det finns nya commits sedan användarens senaste besök.
Datan hämtas från den redan existerande `src/commits.json` som genereras automatiskt vid bygge av `scripts/generate-commits.js` — ingen ny datakälla behövs.

---

## Vad planen saknade (åtgärdat)

Den ursprungliga planen saknade:
- Koppling till befintlig `commits.json`-data
- Konkret filstruktur (vilka filer skapas/ändras)
- Hook-design enligt projektmönstret
- i18n-nycklar (sv + en)
- Var komponenten monteras i trädet
- Testplan
- Steg-för-steg-ordning

---

## Nyckelinsikt: commits.json finns redan

Appen har redan ett system för detta:
- `scripts/generate-commits.js` genererar `src/commits.json` vid varje bygge
- `Commit`-typen finns i `src/types/index.ts`
- Varje commit har `hash`, `date`, `message`

Vi behöver **inte** en ny `ChangeItem`-struktur — vi filtrerar på `Commit.hash` mot vad användaren senast sett.

---

## Teknisk design

### Typer — lägg till i `src/types/index.ts`

```typescript
export interface WhatsNewState {
  lastSeenHash: string; // hash på senaste sedda commit
}
```

> `dismissedChanges[]` från ursprungsplanen behövs inte — det räcker att spara senast sedda hash. Allt nyare visas.

---

### Hook: `src/hooks/useWhatsNew.ts`

```typescript
const STORAGE_KEY = 'buymilk:whats-new-last-seen';

function useWhatsNew() {
  const [showModal, setShowModal] = useState(false);
  const [newCommits, setNewCommits] = useState<Commit[]>([]);

  useEffect(() => {
    const lastSeenHash = localStorage.getItem(STORAGE_KEY);
    const commits: Commit[] = commitsJson;

    if (!lastSeenHash) {
      // Första besöket — markera som sedd, visa inte
      if (commits.length > 0) {
        localStorage.setItem(STORAGE_KEY, commits[0].hash);
      }
      return;
    }

    const idx = commits.findIndex(c => c.hash === lastSeenHash);
    const unseen = idx === -1 ? commits : commits.slice(0, idx);

    if (unseen.length > 0) {
      setNewCommits(unseen);
      setShowModal(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (newCommits.length > 0) {
      localStorage.setItem(STORAGE_KEY, newCommits[0].hash);
    }
    setShowModal(false);
  }, [newCommits]);

  return { showModal, newCommits, dismiss };
}
```

---

### Komponent: `src/components/WhatsNewModal.tsx`

- Återanvänder **inte** befintlig `Modal.tsx` (den är byggd för confirm-dialoger med confirm/cancel-knappar)
- Bygger en dedikerad presentationsmodal med `role="dialog"` och Escape-stöd
- Visar lista med commits grupperade på datum
- Commit-meddelanden parsas: `feat:`, `fix:`, `refactor:` → emoji + etikett
- Knapp: "Stäng" (anropar `dismiss`)

#### Commit-kategorisering (intern hjälpfunktion)

```typescript
function categorizeCommit(message: string): { emoji: string; label: string } {
  if (message.startsWith('feat')) return { emoji: '✨', label: 'Nyhet' };
  if (message.startsWith('fix'))  return { emoji: '🐛', label: 'Buggfix' };
  if (message.startsWith('refactor')) return { emoji: '🔧', label: 'Förbättring' };
  return { emoji: '📝', label: 'Övrigt' };
}
```

---

### Montering — `src/components/Layout.tsx`

Monteras i `Layout` (inuti `ProtectedRoute`) — visas bara för inloggade användare.

```tsx
const { showModal, newCommits, dismiss } = useWhatsNew();
// ...
<WhatsNewModal isOpen={showModal} commits={newCommits} onClose={dismiss} />
```

---

### i18n-nycklar

Lägg till i **både** `sv.json` och `en.json`:

```json
// sv.json
"whatsNew": {
  "title": "Nyheter sedan ditt senaste besök",
  "close": "Stäng",
  "categories": {
    "feat": "Nyhet",
    "fix": "Buggfix",
    "refactor": "Förbättring",
    "other": "Övrigt"
  }
}

// en.json
"whatsNew": {
  "title": "What's new since your last visit",
  "close": "Close",
  "categories": {
    "feat": "New feature",
    "fix": "Bug fix",
    "refactor": "Improvement",
    "other": "Other"
  }
}
```

---

## Implementationssteg (i ordning)

### Steg 1 — Typer
- [ ] Lägg till `WhatsNewState` i `src/types/index.ts`

### Steg 2 — Hook
- [ ] Skapa `src/hooks/useWhatsNew.ts`
- [ ] Skriv test `src/hooks/useWhatsNew.test.ts`
  - Mocka `localStorage` och `commits.json`
  - Testa: första besök → ingen modal
  - Testa: nya commits sedan senaste besök → modal visas
  - Testa: dismiss sparar korrekt hash

### Steg 3 — Komponent
- [ ] Skapa `src/components/WhatsNewModal.tsx`
- [ ] Skriv test `src/components/WhatsNewModal.test.tsx`
  - Testa att commits renderas
  - Testa Escape stänger modalen
  - Testa att `onClose` anropas vid klick på Stäng

### Steg 4 — i18n
- [ ] Uppdatera `src/locales/sv.json`
- [ ] Uppdatera `src/locales/en.json`

### Steg 5 — Montering
- [ ] Importera hook + komponent i `src/components/Layout.tsx`
- [ ] Montera `<WhatsNewModal />` i returträdet

### Steg 6 — Validering
- [ ] Kör `npm run validate`

---

## Verifieringsplan

### Automatiska tester
```bash
npx vitest src/hooks/useWhatsNew.test.ts
npx vitest src/components/WhatsNewModal.test.tsx
npm run validate
```

### Manuell verifiering
1. Rensa `localStorage` → ladda om → ingen modal (första besöket)
2. Sätt `buymilk:whats-new-last-seen` till ett gammalt hash → ladda om → modal visas med nya commits
3. Klicka Stäng → ladda om → modal visas inte igen
4. Verifiera att modalen stängs med Escape
5. Verifiera layout på mobil (375px bredd)