# FoodHero 🍲

FoodHero is a modern, intuitive meal planning and grocery list application designed to make everyday meal preparation, recipe management, and grocery shopping efficient, organized, and data-driven. It combines real-time synchronization with intelligent automation to streamline your meals from recipe to table.

## 🚀 Key Features

### 📅 Meal Planning & Recipes

- **Interactive Meal Planner**: Plan weekly lunches and dinners with an intuitive visual interface.
- **Recipe Management**: Save and organize your favorite recipes with ingredients, instructions, and tags.
- **Recipe Parser**: Paste recipe text or web URLs, and FoodHero will intelligently extract ingredients directly into your shopping list.
- **Ingredient Search**: Search recipes by ingredients you already have at home to reduce food waste.
- **Calendar Export**: Export planned meals directly to your iCal/Google Calendar.

### 🛒 Smart Grocery Lists

- **Real-time Sync**: Seamlessly keep your lists updated across all devices using Firebase.
- **Intelligent Auto-grouping**: Items are automatically sorted into aisles (categories) as you add them, reducing time spent wandering the store.
- **Customizable Aisles**: Define your own categories and keywords to match your preferred store layout.
- **Product History**: Smart autocomplete based on your most frequently added items.
- **Offline Mode**: Continue shopping without internet; the app syncs your changes automatically once you're back online.

### 📥 Advanced Importing & Backups

- **JSON Import/Export**: Full backup and restore support for grocery lists, recipes, and meal plans.

### ✅ Task Management

- **Dedicated Todo View**: A separate space for general tasks and reminders.
- **Priority System**: Organize tasks with High, Medium, and Low priority levels.
- **Detailed Notes**: Add context and details to any todo item.

### 📊 Insights & Analytics

- **Statistics Dashboard**: Visualize your shopping habits with completion rates and item metrics.
- **Usage Trends**: See your most frequently purchased items through integrated charts.
- **Activity Log**: Keep track of changes and updates made to your lists.

### 🛠️ Power User Tools

- **Voice Input**: Add items to your list hands-free using voice-to-text.
- **Wake Lock**: Keep your screen awake while you're in the store so you don't have to keep unlocking your phone.
- **Settings Export/Import**: Easily back up or move your custom aisle configurations.
- **Visual Polish**: Enjoy a clean, responsive UI with dark mode support and confetti celebrations when you finish your shopping.

## 🌍 General

- **Multi-language Support**: Full support for English and Swedish.
- **PWA Ready**: Install as a Progressive Web App for a native-like experience on iOS and Android.

## 🛠️ Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Backend/Database**: Firebase (Firestore & Auth)
- **Internationalization**: react-i18next
- **Build Tool**: Vite
- **Charts**: Recharts

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jojjeboy/foodhero.git
   cd foodhero
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.
