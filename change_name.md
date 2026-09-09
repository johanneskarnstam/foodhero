# Name Change Guide: BuyMilk → FoodHero

## Overview
This document provides a step-by-step guide for changing the name of the **BuyMilk** application to **FoodHero**. It is structured for both human and AI execution, with clear commands, file paths, and expected outcomes.

✅ **Status**: Namnbytet är fullständigt genomfört i kodbasen. Återstående steg är extern migrering (GitHub, Firebase, etc.).

---

## 📌 Prerequisites
- ✅ Access to the GitHub repository: `Jojjeboy/foodhero` (renamed)
- ⚠️ Access to Firebase project: `buymilk` (awaiting migration to `foodhero`)
- Admin access to social media accounts (if applicable)

---

## 📝 Step-by-Step Instructions

---

### Phase 1: Local Codebase Updates
**Goal**: Update all references to "BuyMilk" in the codebase to "FoodHero".

#### 1.1 Update App Titles and Metadata
- **Files to Modify**:
  - `src/locales/sv.json`
  - `src/locales/en.json`
  - `public/manifest.json`
  - `index.html`

- **Actions**:
  1. Replace all instances of `"BuyMilk"` with `"FoodHero"` in the files listed above.
  2. Update the `name` and `short_name` fields in `public/manifest.json` to `"FoodHero"`.
  3. Update the `<title>` tag in `index.html` to `FoodHero`.

- **Verification**:
  ```bash
  grep -r "BuyMilk" src/ public/
  ```

#### 1.2 Update Package Configuration
- **File to Modify**: `package.json`
- **Actions**:
  1. Change the `"name"` field from `"buymilk"` to `"foodhero"`.

- **Verification**:
  ```bash
  npm run validate
  ```

---

### Phase 2: GitHub Repository Updates
**Goal**: Rename the GitHub repository and update all references.

#### 2.1 Rename GitHub Repository
- **Action**:
  1. Navigate to the GitHub repository: [https://github.com/Jojjeboy/buymilk](https://github.com/Jojjeboy/buymilk).
  2. Go to **Settings** > **Repository Name**.
  3. Rename the repository from `buymilk` to `foodhero`.

- **Verification**:
  - Ensure the repository is accessible at `https://github.com/Jojjeboy/foodhero`.

#### 2.2 Update README.md
- **File to Modify**: `README.md`
- **Actions**:
  1. Replace all instances of `BuyMilk` with `FoodHero`.
  2. Update any links or references to the old repository name.

---

### Phase 3: Firebase Project Updates
**Goal**: Migrate Firebase project and update hosting.

#### 3.1 Create New Firebase Project
- **Actions**:
  1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
  2. Click **Add Project** and name it `FoodHero`.
  3. Enable **Firestore**, **Authentication**, and **Hosting** for the new project.

#### 3.2 Migrate Firebase Data (Optional)
- **Actions**:
  ```bash
  firebase use buymilk
  firebase firestore:export gs://buymilk-exports --collection-ids=lists,todos,meals,mealPlans
  firebase use foodhero
  firebase firestore:import gs://buymilk-exports --async
  ```

#### 3.3 Update Firebase Hosting
- **Actions**:
  ```bash
  firebase use foodhero
  npm run build
  firebase deploy --only hosting
  ```

---

### Phase 4: GitHub Pages Hosting Updates
**Goal**: Update GitHub Pages hosting to reflect the new repository name.

#### 4.1 Update GitHub Pages Configuration
- **Actions**:
  1. Ensure GitHub Pages is enabled for the repository.
  2. Update the GitHub Pages source branch (if necessary) in **Settings** > **Pages**. 
  3. The new URL will automatically be `https://jojjeboy.github.io/foodhero/` after the repository is renamed.

#### 4.2 Set Up 404 Redirect (Optional)
- **Actions**:
  1. If you want to redirect the old URL (`https://jojjeboy.github.io/buymilk/`) to the new URL (`https://jojjeboy.github.io/foodhero/`), you can use a custom 404 page with JavaScript redirect logic.
  2. Create or update the `404.html` file in the repository with the following content:
     ```html
     <!DOCTYPE html>
     <html>
       <head>
         <meta charset="utf-8">
         <title>Redirecting to FoodHero</title>
         <script>
           window.location.href = "https://jojjeboy.github.io/foodhero/";
         </script>
       </head>
       <body>
         <p>If you are not redirected automatically, <a href="https://jojjeboy.github.io/foodhero/">click here</a>.</p>
       </body>
     </html>
     ```
  3. GitHub Pages will serve this file for any 404 errors, effectively redirecting users from the old URL to the new one.

---

### Phase 5: User Communication
**Goal**: Inform users about the name change.

#### 5.1 Add In-App Notification
- **File to Modify**: `src/App.tsx` or `src/components/Layout.tsx`
- **Actions**:
  ```tsx
  const [showNameChangeNotice, setShowNameChangeNotice] = useState(true);
  
  if (showNameChangeNotice) {
    setTimeout(() => setShowNameChangeNotice(false), 10000);
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
        <p>Vi har bytt namn till <strong>FoodHero</strong>! 🎉</p>
        <button onClick={() => setShowNameChangeNotice(false)} className="mt-2 text-sm underline">Stäng</button>
      </div>
    );
  }
  ```

---

### Phase 6: Testing and Validation
**Goal**: Ensure all changes are working correctly.

#### 6.1 Local Testing
- **Actions**:
  ```bash
  npm run dev
  ```

#### 6.2 Run Validation Scripts
- **Actions**:
  ```bash
  npm run validate
  ```

#### 6.3 Deploy to Production
- **Actions**:
  ```bash
  npm run build
  firebase deploy --only hosting
  ```

---

## 📊 Verification Checklist
Use this checklist to ensure all steps are completed successfully.

- [x] All instances of `BuyMilk` replaced with `FoodHero` in the codebase (except legacy migration keys).
- [x] `package.json` updated with new name.
- [x] `index.html` updated with new title and metadata.
- [x] `vite.config.ts` PWA manifest updated with new name.
- [x] `public/404.html` updated to remove legacy redirect logic.
- [x] `src/locales/sv.json` and `src/locales/en.json` updated with new app title.
- [x] LocalStorage migration keys added for backward compatibility (`buymilk_language`, `buymilk:whats-new-last-seen`).
- [ ] GitHub repository renamed to `foodhero`.
- [ ] `README.md` updated with new name and links.
- [ ] Firebase project created with the name `FoodHero`.
- [ ] Firebase data migrated (if applicable).
- [ ] Firebase Hosting configured for the new project.
- [ ] GitHub Pages is enabled and configured for the new repository name.
- [ ] In-app notification added for users.
- [ ] Social media accounts updated or created.
- [ ] All tests pass (`npm run validate`).
- [ ] App deployed to production and accessible via the new GitHub Pages URL.

---

## ⚠️ Troubleshooting

### Issue: Firebase Data Migration Fails
- **Solution**: Ensure you have the necessary permissions for both Firebase projects. Use the Firebase CLI to export and import data:
  ```bash
  firebase use buymilk
  firebase firestore:export gs://buymilk-exports
  firebase use foodhero
  firebase firestore:import gs://buymilk-exports --async
  ```

### Issue: GitHub Repository Rename Fails
- **Solution**: Ensure you have admin access to the repository. If the rename option is grayed out, check for:
  - Open pull requests or issues.
  - GitHub Pages enabled (disable temporarily if needed).

### Issue: GitHub Pages Not Updating
- **Solution**: Ensure GitHub Pages is enabled and the source branch is correctly configured. Clear the cache by pushing a small change to the repository.

---

## 📅 Estimated Timeline
| **Phase** | **Estimated Time** | **Dependencies** |
|-----------|-------------------|------------------|
| Phase 1: Local Codebase Updates | 1-2 hours | None |
| Phase 2: GitHub Repository Updates | 1 hour | Phase 1 |
| Phase 3: Firebase Project Updates | 2-4 hours | Phase 1, Firebase access |
| Phase 4: GitHub Pages Hosting Updates | 1 hour | GitHub access |
| Phase 5: User Communication | 1 hour | Phase 1-4 |
| Phase 6: Testing and Validation | 2-3 hours | All phases |
| **Total** | **11-18 hours** | |

---

## 🎯 Final Notes
- **Backup**: Always back up your Firebase data and GitHub repository before making changes.
- **Testing**: Test thoroughly at each phase to avoid issues in production.
- **Communication**: Keep users informed to minimize confusion.

---

## 🤖 AI Execution Commands
If you are an AI or automation tool, use the following commands to execute the steps programmatically:

### 1. Update Local Codebase
```bash
# Replace all instances of "BuyMilk" with "FoodHero" in the codebase
find /Users/jk/kod/buymilk -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" \) -exec sed -i '' 's/BuyMilk/FoodHero/g' {} +;

# Update package.json
sed -i '' 's/"buymilk"/"foodhero"/g' /Users/jk/kod/buymilk/package.json;

# Verify changes
grep -r "BuyMilk" /Users/jk/kod/buymilk/src/ /Users/jk/kod/buymilk/public/ || echo "No instances of BuyMilk found.";
```

### 2. Rename GitHub Repository
```bash
# Note: This requires GitHub API access or manual execution via the GitHub UI.
# Example using GitHub CLI:
gh repo rename Jojjeboy/foodhero
```

### 3. Deploy to Firebase
```bash
cd /Users/jk/kod/buymilk
npm run build
firebase deploy --only hosting
```

### 4. Validate Changes
```bash
cd /Users/jk/kod/buymilk
npm run validate
```
