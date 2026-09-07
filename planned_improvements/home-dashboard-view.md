# Startsida (Home Dashboard) - Implementationsplan

Denna plan beskriver införandet av en ny startsida i BuyMilk som ger användaren en tydlig överblick och snabb åtkomst till appens två kärnområden: **Inköpslista** och **Måltidsplanering**.

Planen följer samtliga riktlinjer i [`AGENTS.md`](../AGENTS.md).

---

## 📋 Översikt & Bakgrund

Idag navigerar rot-URL:en (`/`) direkt till `GroceryListView` (inköpslistan). Måltidsplaneringen nås separat via flikarna. 

Den nya startsidan fungerar som en ren och fokuserad dashboard med två huvudsakliga sektioner/kort:
1. **Övre sektionen — Inköpslista:** Visar en förhandsvisning av de första 3–4 varorna samt en tydlig indikation om det finns fler varor än så kvar att handla. Klick på kortet navigerar till den fullständiga inköpslistevyn.
2. **Nedre sektionen — Måltidsplanering:** Visar dagens eller nästa planerade måltid (och inget mer när måltider finns), eller vid avsaknad av planerade måltider den inbjudande uppmaningen *"Hey, hittar inga planerade måltider, dags att planera matsedeln!"*. Klick på kortet navigerar till matsedelsvyn (`/mealplan`).

---

## 🎯 Fastställda Krav & Beslut

Efter genomgång och resonemang är följande designbeslut fastställda:

### 1. Navigering & Rutter
- **Roten (`/`)**: Blir appens nya startsida (`HomeView`).
- **Inköpslistan**: Flyttas till `/shopping`.
- **Mobilmeny (`BottomNav`) — Alternativ A**:
  - Utökas till 5 tydliga flikar:
    1. **Hem** (`/`, ikon: `LayoutGrid` eller `Home`)
    2. **Inköp** (`/shopping`, ikon: `ShoppingCart`)
    3. **Matsedel** (`/mealplan`, ikon: `CalendarDays`)
    4. **Recept** (`/meals`, ikon: `ChefHat`)
    5. **Mer** (öppnar `MoreDrawer`)
- **Desktopmeny (`Sidebar`)**:
  - Innehåller både **Hem** (`/`) och **Inköpslista** (`/shopping`).
- **Skärmlås / Shopping-overlay (`Layout.tsx`)**:
  - `Layout.tsx` anpassas så att dess snabbfunktioner för fullskärms-shopping och skärmlås aktiveras på `/shopping`.

### 2. Övre kortet — Inköpslista
- **Fokus & Syfte**: Ren, fokuserad överblick (ingen direktinmatning på startsidan i nuläget).
- **Innehåll när varor finns**:
  - Rubrik med `ShoppingCart`-ikon och titel (*Inköpslista*).
  - Tydlig status/räknare: t.ex. *"5 varor kvar att handla"*.
  - Förhandsvisning av de första 3–4 oavkryssade varorna i en ren och kompakt lista.
  - Indikation om det finns fler varor än det som visas: t.ex. en badge eller textrad med *"+2 varor till"*.
  - Framstegsindikator eller visuell hint om hur många varor som är avklarade.
  - Hover-/touch-effekt och pilikon (`ArrowRight`) som visar att hela kortet är klickbart.
- **Innehåll när listan är tom**:
  - Vänligt tomt läge: *"Allt är inhandlat! 🎉"* med uppmaning att öppna listan.
- **Interaktion**: Klick på kortet navigerar till `/shopping`.

### 3. Nedre kortet — Måltidsplanering
- **Innehåll när måltider finns**:
  - Visar enbart dagens middag eller nästa planerade måltid (t.ex. *"Dagens middag: Lasagne"* eller *"Morgondagens middag: Laxfilé med potatis"*).
  - Inga komplicerade veckovyer eller 7-dagarsremsor på startsidan – hålls avsiktligt minimalistiskt och koncist.
- **Innehåll när inga måltider finns**:
  - Den överenskomna uppmaningen: *"Hey, hittar inga planerade måltider, dags att planera matsedeln!"*.
  - Inbjudande grafik/ikon och tydlig call-to-action till matsedeln.
- **Interaktion**: Klick på kortet navigerar till `/mealplan`.

---

## 🏗️ Teknisk Design & Arkitektur

### Komponentkatalog & Ändrade filer
```
src/
├── components/
│   ├── HomeView.tsx             # [NY] Den nya startsidan med de två sektionerna
│   ├── HomeView.test.tsx        # [NY] Enhetstester för alla tillstånd i HomeView
│   ├── BottomNav.tsx            # [UPPDATERA] 5 flikar: Hem, Inköp, Matsedel, Recept, Mer
│   ├── BottomNav.test.tsx       # [UPPDATERA] Tester för de nya flikarna
│   ├── Sidebar.tsx              # [UPPDATERA] Separera Hem och Inköpslista
│   └── Layout.tsx               # [UPPDATERA] Anpassa isShoppingPage till /shopping
├── App.tsx                      # [UPPDATERA] / -> HomeView, /shopping -> GroceryListView
└── locales/
    ├── sv.json                  # [UPPDATERA] Svenska översättningar för dashboard
    └── en.json                  # [UPPDATERA] Engelska översättningar för dashboard
```

### Logik för Nästa Måltid
Samma beprövade logik som återfinns i `GroceryListView.tsx`:
1. Hämta dagens datum och aktuell tidpunkt.
2. Efter kl 19:30 antas dagens middag vara förbi, varför sökningen i första hand tittar på morgondagen.
3. Kontrollera `getPlanForDate(targetDate)`. Finns en måltid (Middag prioriterat, annars Lunch etc.), visa den.
4. Om ingen måltid finns idag/imorgon, scanna framåt genom aktuell vecka för att hitta nästa inlagda måltid.
5. Om ingen måltid hittas alls i veckan -> visa tomrumsuppmaningen *"Hey, hittar inga planerade måltider, dags att planera matsedeln!"*.

---

## 🌐 Internationalisering (i18n)

### `src/locales/sv.json`
```json
"dashboard": {
  "title": "Översikt",
  "shoppingTitle": "Inköpslista",
  "itemsLeft_one": "{{count}} vara kvar att handla",
  "itemsLeft_other": "{{count}} varor kvar att handla",
  "allDone": "Allt är inhandlat! 🎉",
  "emptyList": "Inköpslistan är tom",
  "moreItems": "+{{count}} till",
  "openShopping": "Öppna inköpslistan",
  "mealPlanTitle": "Måltidsplanering",
  "todayDinner": "Dagens middag",
  "tomorrowDinner": "Morgondagens middag",
  "nextMeal": "Nästa måltid",
  "noMealsPlannedPrompt": "Hey, hittar inga planerade måltider, dags att planera matsedeln!",
  "openMealPlan": "Öppna matsedeln"
}
```

### `src/locales/en.json`
```json
"dashboard": {
  "title": "Dashboard",
  "shoppingTitle": "Shopping List",
  "itemsLeft_one": "{{count}} item left to buy",
  "itemsLeft_other": "{{count}} items left to buy",
  "allDone": "Everything is bought! 🎉",
  "emptyList": "The shopping list is empty",
  "moreItems": "+{{count}} more",
  "openShopping": "Open shopping list",
  "mealPlanTitle": "Meal Planning",
  "todayDinner": "Today's dinner",
  "tomorrowDinner": "Tomorrow's dinner",
  "nextMeal": "Next meal",
  "noMealsPlannedPrompt": "Hey, no planned meals found, time to plan the menu!",
  "openMealPlan": "Open meal planner"
}
```

---

## 🚀 Steg-för-steg Implementering (Chunks)

### 📦 CHUNK 1: Branch & Ruttstruktur
- Skapa branch: `git checkout -b feature/home-dashboard-view`
- Skapa stomme `HomeView.tsx`.
- Uppdatera rutter i `src/App.tsx`:
  - `/` -> `<HomeView />`
  - `/shopping` -> `<GroceryListView />`
- Justera `Layout.tsx` för `/shopping`.

### 🌐 CHUNK 2: Internationalisering
- Uppdatera både `src/locales/sv.json` och `src/locales/en.json` med de nya översättningarna.

### 🎨 CHUNK 3: Bygg `HomeView.tsx`
- **Övre sektionen**:
  - Kort med mjuk skugga, hover-effekt (`hover:border-blue-500/50 hover:shadow-md transition-all`), rundade hörn (`rounded-2xl`).
  - ShoppingCart-ikon i temafärg, rubrik och antal varor kvar.
  - Förhandsvisning av de första 3–4 varorna i en vertikal minilista med subtila punkter/ikoner.
  - Rad som visar *"+X varor till"* om det finns fler varor än 4.
  - Tomt-läge om listan är helt tom eller alla varor är avklarade.
  - `onClick={() => navigate('/shopping')}`.
- **Nedre sektionen**:
  - Kort i samma stil som övre kortet.
  - CalendarDays-/Utensils-ikon och rubrik.
  - Läge 1 (måltid finns): Rubrik (*Dagens middag / Morgondagens middag / Nästa måltid*) + måltidens namn i fet text med subtil tagg.
  - Läge 2 (inga måltider): *"Hey, hittar inga planerade måltider, dags att planera matsedeln!"* tillsammans med en inbjudande kalenderknapp/pil.
  - `onClick={() => navigate('/mealplan')}`.

### 🧭 CHUNK 4: Navigationsuppdatering
- Uppdatera `BottomNav.tsx` till 5 flikar (Hem, Inköp, Matsedel, Recept, Mer).
- Uppdatera `Sidebar.tsx` för desktop med Hem och Inköp.

### 🧪 CHUNK 5: Tester & Kvalitetssäkring
- Skapa `HomeView.test.tsx` (tester för varor, tom lista, planerad måltid, oplanerad måltid, klicknavigering).
- Uppdatera tester för `BottomNav.test.tsx` och ev. E2E-tester.
- Köra `npm run validate` och säkerställa 100% grönt resultat.
