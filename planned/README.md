# Planerade förbättringar

Denna mapp innehåller planeringsdokument och implementationsplaner för funktioner och förbättringar i applikationen.

---

## ✅ Genomförda funktioner

### 🥑 1. Namnbyte: BuyMilk → FoodHero
- **Beskrivning**: Övergång från den ursprungliga inköpslistan till FoodHero som en fullfjädrad måltidsplanerings- och inköpsapp.
- **Prioritet**: Hög
- **Omfattning**: UI/i18n, PWA-manifest, ikoner, sidtitlar, metadata, LocalStorage-migrering, paketnamn och GitHub Pages.
- **Dokument**: [change_name.md](../change_name.md)
- **Status**: ✅ Genomfört

---

### 🏠 2. Startsida (Home Dashboard)
- **Beskrivning**: Två primära sektioner: snabb överblick av inköpslistan och dagens måltider i matsedeln.
- **Implementering**: `src/components/HomeView.tsx`
- **Status**: ✅ Genomfört

---

### 📢 3. What's New Modal
- **Beskrivning**: Modal som automatiskt informerar användaren om nya funktioner och ändringar baserat på git-commits.
- **Implementering**: `src/components/WhatsNewModal.tsx` och `src/hooks/useWhatsNew.ts`
- **Status**: ✅ Genomfört

---

### ➕ 4. Snabbaddition av varor från startsidan
- **Beskrivning**: Möjlighet att snabbt lägga till varor direkt från startsidan via ett inputfält med autocomplete-förslag.
- **Implementering**: `src/components/HomeView.tsx`
- **Status**: ✅ Genomfört

---

### 🎨 5. Ikon- och Favicon-generator
- **Beskrivning**: Automatiserat skript för att generera favicon, apple-touch-icon och PWA-ikoner via sharp.
- **Implementering**: `scripts/generate-icons.js` (`npm run generate-icons`)
- **Status**: ✅ Genomfört

---

### 🔍 6. Sök recept på ingrediens (Ingredient Search View)
- **Beskrivning**: Vy för att filtrera och hitta recept baserat på enskilda ingredienser.
- **Implementering**: `src/components/IngredientSearchView.tsx`
- **Status**: ✅ Genomfört

---

### ⚡ 7. Anpassningsbara snabbval (Quick Items)
- **Beskrivning**: Möjlighet att konfigurera vilka snabbval som visas i inköpslistan.
- **Implementering**: `src/components/QuickItemsSettingsModal.tsx`
- **Status**: ✅ Genomfört

---

### 🌙 8. Mörkt läge (Dark Mode)
- **Beskrivning**: Stöd för mörkt läge med växlingsfunktion och anpassade färger för bättre läsbarhet.
- **Implementering**: `src/context/AppContext.tsx`, `src/components/Layout.tsx`, `src/index.css`, `tailwind.config.js`
- **Status**: ✅ Genomfört

---

### 📱 9. Bottom Navigation Bar
- **Beskrivning**: Ersätter sidomenyn med en bottom bar för snabbare navigation mellan vyer på mobilen.
- **Implementering**: `src/components/BottomNav.tsx`
- **Status**: ✅ Genomfört

---

### 🖱️ 10. Drag-and-drop för inköpslistan
- **Beskrivning**: Användare kan dra och släppa varor för att organisera inköpslistan efter butikslayout (t.ex. "Mejeri", "Frukt & Grönt").
- **Implementering**: 
  - `src/components/GroceryListView.tsx` (DndContext, SortableContext, handleDragEnd)
  - `src/components/SortableItem.tsx` (useSortable, drag handle, swipe actions)
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@dnd-kit/modifiers` (beroenden)
- **Funktioner**:
  - Drag-and-drop för aktiva och slutförda varor.
  - Tangentbordsnavigering (Space för att plocka upp, piltangenter för att flytta).
  - Skärmbegränsning (`restrictToParentElement`).
  - Swipe-åtgärder för snabb radering och markering.
- **Testning**: `src/components/SortableItem.test.tsx` (10 tester).
- **Status**: ✅ Genomfört

## 📌 Förenkling & Användbarhetsförbättringar

Följande förslag syftar till att göra FoodHero **lättare, mer logisk och användbar** genom att förenkla flöden, automatisera processer och förbättra användarupplevelsen.

---

### 🎯 1. Förenkla inköpslistans flöde
- **Problem**: Användare måste navigera mellan flera vyer för att lägga till, redigera eller ta bort varor.
- **Lösningsförslag**:
  - ✅ **Snabbaddition direkt från startsidan**: Lägg till ett fält för att snabbt addera varor utan att öppna en ny vy. **Implementerad i `src/components/HomeView.tsx`**.
  - **Drag-and-drop för omordning**: Användare ska kunna dra och släppa varor för att organisera inköpslistan efter butikslayout (t.ex. "Mejeri", "Frukt & Grönt").
  - **Automatisk kategorisering**: Använd fördefinierade regler för att kategorisera varor automatiskt (t.ex. "Mjölk" → "Mejeri").
- **Fördelar**: Minskar antalet klick, gör listan mer intuitiv och anpassad till användarens shoppingvanor.
- **Prioritet**: Hög
- **Komplexitet**: Medel

---

### 🍽️ 2. Smartare måltidsplanering
- **Problem**: Användare glömmer att planera måltider eller har svårt att hitta inspiration.
- **Lösningsförslag**:
  - **Veckans måltidsförslag**: Automatiskt genererade förslag baserade på användarens tidigare recept och preferenser.
  - **Ingrediensöverskridande varningar**: Om en ingrediens redan finns i inköpslistan eller pantry, markera det tydligt för att undvika dubbletter.
  - **Måltidsrotering**: Möjlighet att ställa in återkommande måltider (t.ex. "Taco fredagar").
- **Fördelar**: Sparar tid, minskar matsvinn och gör planeringen mer effektiv.
- **Prioritet**: Medel
- **Komplexitet**: Hög

---

### 🛒 3. Integrera inköpslistan med butiker
- **Problem**: Användare måste manuellt anpassa listan till butikens layout.
- **Lösningsförslag**:
  - **Butiksspecifika listor**: Möjlighet att spara flera inköpslistor anpassade till olika butiker (t.ex. "ICA", "Willys").
  - **Butikskartor**: Visa en karta över butiker i närheten med möjlighet att skicka inköpslistan direkt till butikens app (om integrering finns).
- **Fördelar**: Gör inköpen snabbare och mer organiserade.
- **Prioritet**: Låg
- **Komplexitet**: Hög

---

### 📱 4. Förbättra mobilupplevelsen
- **Problem**: Appen kan kännas krånglig på mindre skärmar.
- **Lösningsförslag**:
  - ✅ **Bottom Navigation Bar**: Ersätt sidomenyn med en bottom bar för snabbare navigation mellan vyer. **Implementerad i `src/components/BottomNav.tsx`**.
  - **Snabbåtgärder via swipe**: Swipe på varor för att snabbt ta bort eller markera som köpt.
  - **Offline-läge**: Full funktion offline med synkronisering vid återanslutning.
- **Fördelar**: Mer intuitiv och snabb användning på mobilen.
- **Prioritet**: Hög
- **Komplexitet**: Medel

---

### 🔍 5. Förbättra sökfunktionen
- **Problem**: Sökningen kan vara otydlig eller sakna relevanta resultat.
- **Lösningsförslag**:
  - **Fuzzy Search**: Sökfunktion som tolererar stavfel.
  - **Global sökning**: Sök i recept, inköpslistor och pantry samtidigt.
  - **Snabbval för vanliga sökningar**: Visa populära söktermer eller tidigare sökningar.
- **Fördelar**: Användare hittar snabbare det de letar efter.
- **Prioritet**: Medel
- **Komplexitet**: Medel

---

### 📊 6. Användarstatistik och insikter
- **Problem**: Användare vet inte hur de använder appen eller var de kan spara tid/pengar.
- **Lösningsförslag**:
  - **Månadsrapport**: Statistik över vanliga inköp, mest använda recept och besparingar.
  - **Pantry-översikt**: Visa vad som snart går ut eller behöver fyllas på.
- **Fördelar**: Ger användaren insikter och motivation.
- **Prioritet**: Låg
- **Komplexitet**: Hög

---

### 💡 7. Sociala funktioner (valfritt)
- **Problem**: Matlagning och inköp kan vara ett socialt evenemang.
- **Lösningsförslag**:
  - **Delade inköpslistor**: Skapa och dela inköpslistor med familj eller vänner.
  - **Gemensamma recept**: Dela recept med varandra eller importera från community-databaser.
- **Fördelar**: Ökar engagemanget och gör appen mer social.
- **Prioritet**: Låg
- **Komplexitet**: Hög

---

### ⚡ 8. Automatisering och AI
- **Problem**: Manuell inmatning kan vara tidskrävande.
- **Lösningsförslag**:
  - **Röststyrning**: Lägg till varor eller recept via röstkommandon.
  - **AI-genererade recept**: Föreslå recept baserat på ingredienser i pantry.
  - **Automatisk inköpslista från recept**: Lägg till ingredienser från recept till inköpslistan automatiskt.
- **Fördelar**: Sparar tid och gör appen mer intelligent.
- **Prioritet**: Låg
- **Komplexitet**: Hög

---

### 🎨 9. UI/UX-förbättringar
- **Problem**: Gränssnittet kan kännas överväldigande eller otydligt.
- **Lösningsförslag**:
  - ✅ **Mörkt läge**: Stöd för mörkt läge för bättre läsbarhet. **Implementerad i `src/context/AppContext.tsx`, `src/components/Layout.tsx`, `src/index.css`, `tailwind.config.js`**.
  - **Anpassningsbara teman**: Välj färgteman (t.ex. "Ljust", "Mörkt", "System").
  - **Guidad tur**: Introduktionstur för nya användare.
- **Fördelar**: Ökar tillgängligheten och användarvänligheten.
- **Prioritet**: Medel
- **Komplexitet**: Låg

---

### 🔄 10. Feedback och kontinuerlig förbättring
- **Problem**: Utvecklare vet inte vad användare tycker eller vad som kan förbättras.
- **Lösningsförslag**:
  - **Feedback-knapp**: Skicka feedback eller felrapporter direkt från appen.
  - **Beta-testning**: Testa nya funktioner innan de släpps.
- **Fördelar**: Säkerställer att appen utvecklas i linje med användarnas behov.
- **Prioritet**: Låg
- **Komplexitet**: Medel

---

## 📅 Prioriteringsöversikt

| **Funktion**                     | **Prioritet** | **Komplexitet** | **Användarvärde** | **Status**       |
|----------------------------------|--------------|----------------|-------------------|------------------|
| Snabbaddition från startsidan    | Hög          | Låg            | Hög               | ✅ Genomfört     |
| Bottom Navigation Bar            | Hög          | Medel          | Hög               | ✅ Genomfört     |
| Drag-and-drop för inköpslistan  | Medel        | Medel          | Hög               | ✅ Genomfört     |
| Automatisk kategorisering        | Medel        | Hög            | Medel             | ❌ Ej påbörjad    |
| Veckans måltidsförslag           | Medel        | Hög            | Hög               | ❌ Ej påbörjad    |
| Förbättra sökfunktionen          | Medel        | Medel          | Hög               | ❌ Ej påbörjad    |
| Mörkt läge                       | Medel        | Låg            | Hög               | ✅ Genomfört     |
| Anpassningsbara teman            | Medel        | Låg            | Hög               | ❌ Ej påbörjad    |
| Butiksspecifika listor           | Låg          | Hög            | Medel             | ❌ Ej påbörjad    |
| Användarstatistik                | Låg          | Hög            | Medel             | ❌ Ej påbörjad    |

---

## 🚀 Nästa prioriterade funktion: Automatisk kategorisering

### 📌 Översikt
- **Funktion**: Automatisk kategorisering av varor i inköpslistan.
- **Mål**: Användare ska kunna organisera sin inköpslista automatiskt baserat på fördefinierade regler (t.ex. "Mjölk" → "Mejeri").
- **Prioritet**: Medel
- **Komplexitet**: Hög
- **Användarvärde**: Medel

---

## 🚀 Rekommenderad implementeringsordning
1. **Förenkla inköpslistans flöde** (Snabbaddition ✅, drag-and-drop ✅, automatisk kategorisering).
2. **Förbättra mobilupplevelsen** (Bottom Navigation Bar ✅, swipe-åtgärder, offline-läge).
3. **Smartare måltidsplanering** (Veckans förslag, ingrediensöverskridande varningar).
4. **UI/UX-förbättringar** (Mörkt läge ✅, anpassningsbara teman, guidad tur).
5. **Förbättra sökfunktionen** (Fuzzy search, global sökning).
6. **Avancerade funktioner** (Butiksintegrering, AI, sociala funktioner, användarstatistik).
