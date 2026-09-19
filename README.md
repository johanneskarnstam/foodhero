# FoodHero 🍲

FoodHero är en modern och intuitiv app för måltidsplanering och inköpslistor, designad för att göra matlagning, recepthantering och inköp effektivt, organiserat och datadrivet. Appen kombinerar realtidsynkronisering med intelligent automatisering för att förenkla dina måltider från recept till bord.

## 🚀 Huvudfunktioner

### 📅 Måltidsplanering och recept

- **Interaktiv måltidsplanerare**: Planera veckans luncher och middagar med ett intuitivt visuellt gränssnitt.
- **Recepthantering**: Spara och organisera dina favoritrecept med ingredienser, instruktioner och taggar.
- **AI-komplettering och generering av recept**: Skapa nya recept från fri textprompt eller komplettera automatiskt ofärdiga recept (ingredienser, tillagningssteg, portioner och taggar) via Google Gemini AI direkt i appen.
- **AI-modellväljare med prestandaindex**: Välj och anpassa Gemini-modell i inställningarna. Modellerna rangordnas med bäst prestanda överst, har tydliga beskrivningar av sina styrkor och ett beräknat prestandaindex (1.0–10.0) med förklarande modal.
- **Intelligenta modellförslag & automatisk fallback**: Om vald modell är överbelastad, inte svarar eller inte kan leverera resultat föreslås automatiskt en lämplig alternativ modell med snabbvalsknapp direkt i felvyn samt automatisk fallback vid nätverks- och kapacitetsfel.
- **Receptanalysator**: Klistra in recepttext eller webbadresser, så extraherar FoodHero automatiskt ingredienser direkt till din inköpslista.
- **Ingredienssökning**: Sök recept baserat på ingredienser du redan har hemma för att minska matsvinnet.
- **Kalenderexport**: Exportera planerade måltider direkt till din iCal/Google Calendar.

### 🛒 Smarta inköpslistor

- **Realtidssynkronisering**: Håll dina listor uppdaterade på alla enheter med hjälp av Firebase.
- **Drag-and-drop**: Organisera din inköpslista genom att dra och släppa varor för att matcha butikslayouten (t.ex. "Mejeri", "Frukt & Grönt").
- **Intelligent automatisk gruppering**: Varor sorteras automatiskt i kategorier (butiksgator) när du lägger till dem, vilket minskar tiden du spenderar i butiken.
- **Anpassningsbara butiksgator**: Definiera egna kategorier och nyckelord för att matcha din föredragna butikslayout.
- **Produkthistorik**: Smart autofyllning baserat på dina mest frekvent tillagda varor.
- **Offline-läge**: Fortsätt handla utan internet; appen synkroniserar dina ändringar automatiskt när du är online igen.

### 📥 Avancerad import och säkerhetskopiering

- **JSON Import/Export**: Fullständigt stöd för säkerhetskopiering och återställning av inköpslistor, recept och måltidsplaner.

### ✅ Uppgiftshantering

- **Dedikerad att-göra-vy**: En separat plats för allmänna uppgifter och påminnelser.
- **Prioritetssystem**: Organisera uppgifter med hög, medel och låg prioritet.
- **Detaljerade anteckningar**: Lägg till sammanhang och detaljer till alla att-göra-postar.

### 📊 Insikter och analys

- **Statistikdashboard**: Visualisera dina inköpsvanor med slutförandegrad och varumått.
- **Användningstrender**: Se dina mest frekvent köpta varor genom integrerade diagram.
- **Aktivitetslogg**: Håll koll på ändringar och uppdateringar som gjorts i dina listor.

### 🛠️ Avancerade verktyg

- **Röstinmatning**: Lägg till varor i din lista utan händer med hjälp av röst-till-text.
- **Skärmlås**: Håll skärmen aktiv när du är i butiken så att du inte behöver låsa upp telefonen hela tiden.
- **Inställningsimport/export**: Säkerhetskopiera eller flytta dina anpassade butiksgatukonfigurationer enkelt.
- **Visuell design**: Njuta av ett rent, responsivt gränssnitt med stöd för mörkt läge och konfetti-firande när du slutför din inköpslista.

## 🌍 Allmänt

- **Flerspråkigt stöd**: Fullständigt stöd för engelska och svenska.
- **PWA-klart**: Installera som en Progressiv Web App för en inbyggd upplevelse på iOS och Android.

## 🛠️ Teknisk stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Backend/Databas**: Firebase (Firestore & Auth)
- **AI-integrering**: Google Generative AI (Gemini API)
- **Internationellisering**: react-i18next
- **Byggverktyg**: Vite
- **Diagram**: Recharts

## 🏁 Kom igång

### Förutsättningar

- Node.js (Senaste LTS rekommenderas)
- npm eller pnpm

### Installation

1. Klona repositoryt:
   ```bash
   git clone https://gitlab.com/jojjeboy/foodhero.git
   cd foodhero
   ```
2. Installera beroenden:
   ```bash
   npm install
   ```
3. Starta utvecklingsservern:
   ```bash
   npm run dev
   ```
4. Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

### Bildsökning för recept

För automatisk och manuell receptbildsökning, lägg till följande variabler i `.env`:

```env
VITE_UNSPLASH_ACCESS_KEY=din_unsplash_nyckel
VITE_PEXELS_API_KEY=din_pexels_nyckel
```

Unsplash används först och Pexels som fallback. Utan nycklar fortsätter receptgenerering och redigering att fungera, men utan automatisk bild.
