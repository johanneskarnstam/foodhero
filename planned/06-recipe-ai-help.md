# Plan 06 – AI-hjälp inne på recept

## Mål

Göra det möjligt att ställa frågor till AI direkt när användaren tittar på ett recept. Hjälpen ska vara kontextmedveten och praktisk, till exempel:

- "Jag saknar grädde – vad kan jag använda i stället?"
- "Kan jag laga detta utan nötter?"
- "När ska jag lägga i vitlöken?"
- "Hur omvandlar jag mängden till fyra portioner?"

Användaren ska kunna skriva flera följdfrågor i samma öppna hjälpvy och alltid kunna se vilket recept frågan gäller.

## Bakgrund & avgränsning

`MealDetailModal` visar redan ingredienser och instruktioner och har en befintlig AI-koppling via `useAiRecipe` och `services/aiService.ts`. Den kopplingen används idag främst för att generera eller komplettera recept. Den nya funktionen bör återanvända den aktiva Gemini-modellen, felhanteringen och modellförslaget, men få en separat operation för frågor om ett befintligt recept.

MVP omfattar textfrågor och textsvar i en tillfällig konversation. Historik, röstinmatning, bildanalys och automatisk ändring av receptet ingår inte i första versionen.

## Användarflöde

1. Användaren öppnar ett recept i `MealDetailModal`.
2. Användaren trycker på en tydlig knapp, till exempel **Fråga AI om receptet**.
3. En modal eller panel öppnas med receptets namn och ett textfält.
4. Användaren kan välja en snabbfråga eller skriva en egen fråga.
5. Frågan skickas tillsammans med receptets relevanta data till AI:n.
6. Svaret visas i konversationen med tydlig loading-, fel- och retry-status.
7. Användaren kan ställa en följdfråga utan att behöva öppna hjälpen igen.
8. När hjälpen stängs rensas den tillfälliga konversationen.

## Steg-för-steg implementation

### Steg 1 – Definiera API-kontraktet för receptfrågor

**Filer:** `src/services/aiService.ts`, eventuellt `src/types/index.ts`

- Lägg till en typ för ett receptsvar, exempelvis `RecipeAiAnswer` med text och eventuella metadatafält.
- Lägg till en funktion, exempelvis `askAboutRecipe(question, meal, history?)`, som använder aktiv AI-modell.
- Skicka endast den receptdata som behövs: namn, beskrivning, portioner, ingredienser och instruktioner.
- Begränsa eller normalisera frågelängd och konversationshistorik så att prompten inte växer obegränsat.
- Returnera ett vanligt textsvar, inte recept-JSON. Funktionen ska avvisa tomma frågor och ge samma användarvänliga felhantering som befintliga AI-anrop.

### Steg 2 – Utforma systeminstruktionen

**Fil:** `src/services/aiService.ts`

Systeminstruktionen ska instruera modellen att:

- svara på svenska eller på samma språk som användarens fråga,
- utgå från receptets faktiska ingredienser och steg,
- tydligt markera när ett svar är ett förslag eller en uppskattning,
- föreslå rimliga ersättare vid saknade ingredienser och beskriva viktiga mängd- eller smakskillnader,
- inte hitta på att en ingrediens eller instruktion finns i receptet,
- be om förtydligande när frågan saknar tillräcklig information,
- inte ändra receptet, lova medicinsk säkerhet eller ersätta professionella råd vid allergier och andra hälsorisker.

Receptinnehållet ska behandlas som kontext, inte som nya systeminstruktioner. Lägg inte API-nycklar eller annan känslig information i prompten eller klientens UI.

### Steg 3 – Skapa hook för frågeflödet

**Fil:** `src/hooks/useRecipeAiHelp.ts` [NY]

Hooken ansvarar för:

- meddelandelista med rollerna `user` och `assistant`,
- `isLoading`, `error` och eventuell `suggestedModel`,
- att skicka aktuell fråga och receptkontext till `askAboutRecipe`,
- att ignorera tomma frågor och förhindra dubbla samtidiga anrop,
- att kunna försöka igen efter fel,
- att rensa konversationen när hjälpen stängs eller receptet byts.

Exponera tydliga typer och undvik `any`. Hooken ska inte själv ansvara för rendering eller modal-layout.

### Steg 4 – Bygg `RecipeAiHelpModal`

**Filer:** `src/components/RecipeAiHelpModal.tsx` [NY], `src/components/RecipeAiHelpModal.test.tsx` [NY]

Skapa en återanvändbar modal/panel som tar emot `meal`, `isOpen` och `onClose`.

UI:t ska innehålla:

- receptnamn och en kort kontextmarkering,
- scrollbar meddelandelista där användarens frågor och AI-svar skiljs åt,
- tre till fyra snabbfrågor som kan fylla/skicka en fråga,
- textfält med tydlig submit-knapp,
- disabled/loading-läge under anrop,
- felmeddelande med retry,
- stöd för Enter för att skicka och Shift+Enter för radbrytning,
- tillgängligt namn, fokus vid öppning och återföring av fokus vid stängning,
- korrekt beteende på små skärmar och med mörkt tema.

Rendera AI-svar som säkert textinnehåll i första versionen. Lägg inte in rå HTML eller markdown-rendering utan en separat säkerhetsbedömning.

### Steg 5 – Koppla hjälpen till receptdetaljen

**Filer:** `src/components/MealDetailModal.tsx`, närmaste parent som äger modalens state

- Lägg till en ikonknapp eller textknapp med `Sparkles`/passande befintlig ikon i receptets actionyta.
- Visa knappen när ett recept finns. Om receptet saknar ingredienser eller instruktioner ska hjälpen ändå kunna förklara begränsningen tydligt.
- Låt parent-komponenten äga `helpMeal`/open-state så att `MealDetailModal` och hjälpmodalens lagerordning fungerar tillsammans.
- Stäng eller pausa bakomliggande receptmodal på ett konsekvent sätt så att fokus och Escape-hantering inte krockar.
- Frågefunktionen får inte automatiskt spara AI:s förslag i receptet. Eventuell ändring av receptet blir en separat framtida funktion.

### Steg 6 – Lägg till översättningar

**Filer:** `src/locales/sv.json`, `src/locales/en.json`

Lägg till alla användarvända texter i båda språken, bland annat:

- knapp och modalrubrik,
- placeholder och skicka-knapp,
- snabbfrågor,
- loading-, tomt-, fel- och retry-lägen,
- varning om att AI-svar kan vara felaktiga,
- tillgängliga etiketter och aria-texter.

### Steg 7 – Tester

**Filer:** `src/services/aiService.test.ts`, `src/hooks/useRecipeAiHelp.test.ts` [NY], `src/components/RecipeAiHelpModal.test.tsx` [NY], berörda tester för `MealDetailModal`

Testa minst:

- att receptdata och frågan skickas till AI-tjänsten,
- att tom fråga inte skickas,
- att flera följdfrågor behåller ordningen,
- att loading blockerar dubbla submits,
- att AI-svar och fel renderas korrekt,
- att retry fungerar,
- att snabbfrågorna skickas med rätt text,
- att modalens öppna/stängda state och fokus fungerar,
- att svenska och engelska nycklar finns och används,
- att användartext och AI-svar renderas som text utan osäker HTML.

Mocka AI-anropen i komponent- och hooktester så att testerna inte kräver API-nyckel eller nätverk.

### Steg 8 – Validering och dokumentation

- Kör riktade tester för service, hook och modal.
- Kör `npm run validate` enligt projektets obligatoriska valideringsflöde.
- Kontrollera manuellt desktop och mobil: öppna recept, ställ fråga, stäng modal, öppna igen och växla språk.
- Om lokal Firebase-autentisering blockerar kontrollen ska `127.0.0.1` läggas till som auktoriserad domän och kontrollen köras om.
- Dokumentera eventuella begränsningar i `README.md` om funktionen kräver särskild miljövariabel eller ändrade Firebase-/deployinställningar.

## Filer som berörs

| Fil | Åtgärd |
|---|---|
| `src/services/aiService.ts` | Ny operation för receptfrågor och säker promptkontext |
| `src/services/aiService.test.ts` | Tester för API-kontrakt, validering och fel |
| `src/hooks/useRecipeAiHelp.ts` | **[NY]** State och livscykel för frågekonversationen |
| `src/hooks/useRecipeAiHelp.test.ts` | **[NY]** Hooktester |
| `src/components/RecipeAiHelpModal.tsx` | **[NY]** UI för frågor och svar |
| `src/components/RecipeAiHelpModal.test.tsx` | **[NY]** Komponenttester |
| `src/components/MealDetailModal.tsx` | Öppna receptets AI-hjälp |
| Närmaste parent till `MealDetailModal` | Äga hjälpmodalens state och modalflöde |
| `src/locales/sv.json` | Svenska översättningar |
| `src/locales/en.json` | Engelska översättningar |
| `src/types/index.ts` | Delade meddelande-/svarstyper vid behov |

## Beroenden och beslut

- **Plan 04 – AI Model Selector:** använd samma aktiva modell och fallbacklogik. Plan 06 kan implementeras efter eller parallellt med Plan 04 om den återanvänder befintliga publika hjälpfunktioner.
- Ingen ny AI-leverantör behövs för MVP.
- Ingen permanent chatthistorik eller Firestore-schemaändring behövs för MVP.
- Om klienten fortsätter prata direkt med Gemini bör rate limiting, kostnadsbegränsningar och skydd av API-nyckel granskas separat före bred produktion.

## Framtida utbyggnad

- Spara användbara svar som receptanteckning efter uttryckligt godkännande.
- Knapp för "Använd detta alternativ" med förhandsgranskning innan receptet ändras.
- Frågor om en markerad ingrediens eller ett markerat tillagningssteg.
- Röstinmatning och uppläsning.
- Sessionshistorik per recept om användarna faktiskt behöver återkomma till svaren.

## Checklista

- [x] API-kontrakt och typer för receptfrågor är definierade
- [x] Systeminstruktion och säker promptkontext är implementerad
- [x] `useRecipeAiHelp` är implementerad
- [x] `RecipeAiHelpModal` är implementerad
- [x] Hjälpknapp och modal state är kopplade till receptdetaljen
- [x] Loading, fel, retry och tom fråga fungerar
- [x] Snabbfrågor och följdfrågor fungerar
- [x] Svenska och engelska översättningar är tillagda
- [x] Tillgänglighet för fokus, Escape och tangentbord är verifierad
- [x] Tester för service, hook och komponent är gröna
- [x] `npm run validate` är grönt
- [x] Manuell kontroll på desktop och mobil är genomförd
- [x] Säkerhet, kostnad och API-nyckelhantering är granskad för MVP och använder samma befintliga Gemini-konfiguration som övriga AI-funktioner; fortsatt rekommenderad granskning för bred produktion och kostnadsskydd
