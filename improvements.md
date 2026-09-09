# FoodHero - Förbättringslista

Detta dokument spårar planerade och föreslagna förbättringar för **FoodHero**. Använd kryssrutorna nedan för att följa framstegen när de implementeras.

## 🛒 Inköpslistan

- [ ] **Delade listor**: Implementera realtidssamarbete så att flera användare kan hantera samma inköpslista via Firebase.
- [ ] **Prisestimering**: Lägg till valfria prisfält för varor för att beräkna en uppskattad totalsumma för inköpsresan.
- [ ] **Förbättrade enheter**: Förbättra stödet för enheter (t.ex. kg, st, dl) med bättre validering och konsekvent formatering.
- [ ] **Export till CSV/PDF**: Generera en utskriftsvänlig PDF eller en ren CSV-fil av den aktuella inköpslistan.

## 🍲 Måltidsplanering & Recept

- [ ] **Snabba inköpslistor**: Lägg till en funktion för att omedelbart lägga till alla saknade ingredienser från en planerad måltid till inköpslistan.
- [ ] **Smarta förslag**: Föreslå måltider baserat på varor som köps ofta, säsongstrender eller användarpreferenser.
- [ ] **Import av ingredienser via URL**: Implementera en backend-scraper för att importera ingredienser direkt från recept-URL:er.
- [x] **Kalenderintegration**: Möjlighet att exportera måltidsplanen till externa kalendrar som iCal eller Google Calendar.

## ✨ UI/UX & Tillgänglighet

- [ ] **Anpassad kategoristil**: Tillåt användare att anpassa kategoritaggar med egna färger och ikoner.
- [ ] **PWA-optimering**: Förbättra upplevelsen för "Lägg till på hemskärmen" och optimera offline-kapaciteten för en mer app-liknande känsla.
- [ ] **Onboarding-flöde**: Skapa en enkel guidad tur för nya användare för att hjälpa dem komma igång med sin första lista och måltidsplan.

## 🧠 Avancerade funktioner

- [ ] **Skafferi-hantering**: Implementera en "Skafferi"-funktion för att hålla koll på varor som redan finns hemma och automatiskt dra av dem från inköpslistan.
- [ ] **AI-receptförslag**: Generera receptförslag baserat på vad som för tillfället finns i inköpslistan eller skafferiet.
