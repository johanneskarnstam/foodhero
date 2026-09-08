# AGENTS.md — Global AI Agent Instructions & Guidelines

> **Purpose:** This file defines the architecture, coding standards, git workflows, and validation rules for all AI coding assistants (Cline, Cursor, Windsurf, Claude Code, GitHub Copilot, etc.) working on this repository.

---

## 1. Project Overview & Tech Stack

This project is a modern web application built with the following core stack:

- **Frontend:** React 19, Vite, TypeScript.
- **Styling:** Tailwind CSS (`clsx` / `tailwind-merge` for dynamic classes).
- **Backend & Database:** Firebase (Authentication, Firestore).
- **Internationalization:** `i18next` / `react-i18next` (Dual support: Swedish & English).
- **Testing Framework:** Vitest, `@testing-library/react`.

---

## 2. Directory & Architecture Structure

Maintain the established directory responsibilities. Do not create top-level directories without reason.

```
src/
├── components/   # Presentational & UI components (small, modular)
├── context/      # Global state providers (React Context)
├── hooks/        # Custom hooks, business logic & Firebase integration (e.g. useFirestoreSync)
├── locales/      # Translation files (sv.json and en.json)
├── types/        # Centralized TypeScript definitions (src/types/index.ts)
└── utils/        # Pure helper and utility functions
```

---

## 3. Mandatory Validation Workflow

### Non-Negotiable Quality Check

Before reporting any task as complete or finalizing code changes, you **MUST** run:

```bash
npm run validate
```

- If `npm run validate` fails, analyze the errors, fix them, and re-run until it passes 100%.
- Never assume a change is safe without completing this validation.

---

## 4. Git Workflow & Commit Rules

### Feature Branch Strategy

Always work on dedicated feature branches for new features or non-trivial fixes:

1. **Create Branch:**
   ```bash
   git checkout -b feature/brief-description
   ```
2. **Develop & Validate:** Implement changes locally and ensure `npm run validate` passes.
3. **Commit & Push (Commit messages MUST be in Swedish):**
   - Format: `<type>: <beskrivning på svenska>`
   - Examples: `feat: lägg till ny receptredigerare`, `fix: justera tabb-layout på mobilen`
   ```bash
   git add .
   git commit -m "feat: din beskrivning på svenska"
   git push origin feature/brief-description
   ```
4. **CI Verification:** Verify remote build/CI pipeline using `gh run list` or via GitHub UI.
5. **Merge to Main:**
   ```bash
   git checkout main
   git merge feature/brief-description
   git push origin main
   ```
6. **Branch Cleanup:**
   ```bash
   git branch -d feature/brief-description
   git push origin --delete feature/brief-description
   ```

---

## 5. Coding Standards & Conventions

### TypeScript & Type Safety

- **Strict Typing:** Avoid `any` completely. Use explicit interfaces or types.
- **Centralized Types:** Put all shared data structures in `src/types/index.ts`.
- **Null Safety:** Consistently use optional chaining (`?.`) and nullish coalescing (`??`).

### React Best Practices

- **Component Design:** Use functional components with hooks. Keep components lean and UI-focused.
- **Custom Hooks:** Extract complex state management or side-effects into `src/hooks/`.
- **Props:** Define explicit TypeScript interfaces for all component props.

### Firebase & Data Management

- **Data Synchronization:** Always use established custom hooks (e.g., `useFirestoreSync`) in `src/hooks/` rather than direct Firestore calls in components.
- **Security Rules:** Consider Firestore security constraints when altering schemas or data flow.

### Internationalization (i18n)

- **Dual Language Rule:** All user-facing text must be externalized.
- **Synchronization:** When adding or updating translation keys, update **BOTH** files:
  - `src/locales/sv.json` (Swedish)
  - `src/locales/en.json` (English)
- **Implementation:** Use `useTranslation` from `react-i18next` for rendering text in components.

### Styling & Design System

- **Tailwind CSS:** Rely strictly on Tailwind utility classes.
- **Dynamic Utility Class Merging:** Use `clsx` or `tailwind-merge` when combining conditional classes.
- **Consistency:** Respect existing color palettes, spacing, and typography scales.

---

## 6. Testing Requirements

- **Framework:**
  - **Unit & Component Testing:** Vitest with @testing-library/react.

- **Coverage Mandatory:** Every new feature, hook, or critical bug fix must include tests in `.test.ts` or `.test.tsx` files.
- **Test Execution:**
  - Run full test suite: `npm run test`
  - Run specific test file while working: `npx vitest src/components/MyComponent.test.tsx`
- **Naming Convention:** Use clear, descriptive test descriptions explaining expected behaviors (e.g., `it('should render shopping list when items are present', ...)`).

---

## 7. AI Agent Operating Guidelines

1. **Context Awareness:** Read and analyze existing project structure and nearby files before editing or creating new files.
2. **Tool Discipline:** Use file reading tools (`read_file`) to inspect the full file context before performing inline modifications (`replace_in_file`).
3. **Architectural Alignment:** Follow existing patterns rather than introducing conflicting paradigms.
4. **Tone & Style:** Keep all responses direct, concise, technical, and actionable.

---

## 8. Versioning & Release Management

### Semantic Versioning (SemVer)
This project follows [Semantic Versioning 2.0.0](https://semver.org/) for `package.json`. The version number is structured as `MAJOR.MINOR.PATCH`.

### When to Update the Version
The version in `package.json` **MUST** be incremented **automatically by the AI agent** when:
- All tests pass (`npm run validate` succeeds).
- Changes are ready to be merged into the `main` branch.

### Version Update Criteria
The AI agent **MUST** determine the version type (MAJOR, MINOR, or PATCH) based on the following rules:

| Version Type | When to Use                                                                                     | Examples                                                                                     |
|--------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| **MAJOR**    | Incompatible API changes, breaking changes, or major architectural overhauls.                  | Removing a core feature, changing Firebase schema in a non-backward-compatible way.       |
| **MINOR**    | Backward-compatible new functionality or significant improvements.                              | Adding a new feature, new hooks, or major UI/UX improvements.                                |
| **PATCH**    | Backward-compatible bug fixes, minor improvements, or non-functional changes (e.g., styling). | Fixing a bug, adjusting layouts, or updating dependencies without functional impact.       |

### How to Update the Version
1. **AI Agent Responsibility:** Before merging to `main`, the AI agent **MUST** update the version in `package.json` according to the criteria above.
2. **Commit the Change:** Include the version update in the same commit or PR that introduces the change.
   - Example commit message: `release: bump version to 1.1.0`
3. **Verify:** Ensure `npm run validate` passes before merging.
