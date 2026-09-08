# Planerade förbättringar

Denna mapp innehåller planeringsdokument och implementationsplaner för funktioner och förbättringar i applikationen.

---

## 🚀 Aktuella implementationsplaner

### 🥑 1. Namnbyte: BuyMilk → FoodHero
- **Beskrivning**: Övergång från den ursprungliga inköpslistan till FoodHero som en fullfjädrad måltidsplanerings- och inköpsapp.
- **Prioritet**: Hög
- **Omfattning**: UI/i18n, PWA-manifest, ikoner, sidtitlar, metadata, LocalStorage-migrering, paketnamn och GitHub Pages.
- **Dokument**: [rename-to-foodhero.md](./rename-to-foodhero.md)
- **Status**: Redo för genomförande

---

## ✅ Genomförda funktioner

Följande funktioner har tidigare planerats, implementerats och validerats i projektet:

1. **Startsida (Home Dashboard)**
   - Två primära sektioner: snabb överblick av inköpslistan och dagens måltider i matsedeln.
   - Implementerad i `src/components/HomeView.tsx`.

2. **What's New Modal**
   - Modal som automatiskt informerar användaren om nya funktioner och ändringar baserat på git-commits.
   - Implementerad i `src/components/WhatsNewModal.tsx` och `src/hooks/useWhatsNew.ts`.

3. **Ikon- och Favicon-generator**
   - Automatiserat skript för att generera favicon, apple-touch-icon och PWA-ikoner via sharp.
   - Implementerad i `scripts/generate-icons.js` (`npm run generate-icons`).

4. **Sök recept på ingrediens (Ingredient Search View)**
   - Vy för att filtrera och hitta recept baserat på enskilda ingredienser.
   - Implementerad i `src/components/IngredientSearchView.tsx`.

5. **Anpassningsbara snabbval (Quick Items)**
   - Möjlighet att konfigurera vilka snabbval som visas i inköpslistan.
   - Implementerad i `src/components/QuickItemsSettingsModal.tsx`.
