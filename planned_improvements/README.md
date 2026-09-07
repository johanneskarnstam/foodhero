# Planned Improvements

This directory contains planning documents for upcoming features and improvements to the BuyMilk application.

## Current Implementations

### ✅ Customizable Quick Items (COMPLETED)

- **Status**: Fully implemented and validated
- **Files**: See implementation summary in main documentation
- **Features**: Users can customize which quick-add grocery items appear in the dropdown

## Planned Features

### 📋 1. What's New Modal

- **Description**: A modal that displays recent changes since the user's last visit
- **Priority**: High
- **Storage**: localStorage for tracking last viewed version/changes
- **Trigger**: Automatically shown on app open if there are new changes
- **File**: [whats-new-modal.md](./whats-new-modal.md)

### 🔍 2. Ingredient Search View

- **Description**: A view to search for recipes by ingredient (e.g., "falukorv", "lax")
- **Priority**: High
- **Functionality**: Simple single-word filtering of recipes containing that ingredient
- **Access**: Behind a button in the /meals page or /mealplan
- **File**: [ingredient-search-view.md](./ingredient-search-view.md)
- **Status**: Implementation plan created ✅

### 🏠 3. Startsida (Home Dashboard)

- **Description**: Ny startsida med två primära sektioner: Inköpslista (övre) och Måltidsplanering (nedre).
- **Priority**: High
- **Functionality**: Snabb överblick över varor att handla och planerad matsedel, med direktnavigering till respektive vy.
- **File**: [home-dashboard-view.md](./home-dashboard-view.md)
- **Status**: Implementation plan created ✅

## Implementation Order

1. Startsida (Home Dashboard) / What's New Modal
2. Ingredient Search View (enhances recipe discovery)

## Notes

- All features should follow existing design patterns
- Include proper TypeScript types
- Add translations for both Swedish and English
- Write tests for new functionality
- Pass validation (`npm run validate`)
