# 🧪 E2E Testing Guide - Firebase Emulator

Denna guide förklarar hur du ställer in och använder Firebase Emulator för Playwright E2E-tester.

## 📋 Förutsättningar
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Java JDK 11+ (krävs för Firebase Emulator)

## 🚀 Snabbstart

```bash
# 1. Installera beroenden
npm install

# 2. Logga in på Firebase
firebase login

# 3. Starta emulatorn
npm run emulator:start

# 4. Ladda testdata (i nytt terminalfönster)
npm run emulator:seed

# 5. Kör tester (i nytt terminalfönster)
npm run test:e2e:emulator
```

## 🛠️ NPM Skript

| Skript | Beskrivning |
|--------|-------------|
| `emulator:start` | Startar Firebase Emulator |
| `emulator:stop` | Stoppar Firebase Emulator |
| `emulator:seed` | Laddar testdata |
| `emulator:clear` | Rensar data |
| `emulator:init` | Startar om + laddar data |
| `test:e2e:emulator` | Kör tester med emulator |

## 🎯 Portinställningar
- Authentication: `localhost:9099`
- Firestore: `localhost:8080`
- Emulator UI: `localhost:4000`

## 💡 Tips
- Använd Emulator UI på `http://localhost:4000` för att inspektera data
- Kör `npm run test:e2e:headed` för att se browserfönstret
- Använd `await page.pause()` för att pausa tester och debugga