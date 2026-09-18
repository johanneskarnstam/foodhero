export interface Recipe {
    id: string;
    title: string;
    description?: string;
    servings?: number;
    ingredients: {
        text: string;               // t.ex. "Krossade tomater"
        amount?: string;            // t.ex. "2 förp" eller "500g"
        checkIfExistAtHome?: boolean;
    }[];
    instructions?: string[];        // Steg-för-steg-instruktioner
    tags?: string[];                // t.ex. ["Lättlagat", "Vegetariskt"]
    createdAt: string;
}

// 2. Måltid/Dag i Matschemat
export type MealType = 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
    id: string;
    recipeId?: string;
    customTitle?: string;
    notes?: string;
}

export interface DayPlan {
    date: string;
    meals: {
        type: MealType;
        plannedMeal: PlannedMeal;
    }[];
}

// 3. Totalt Matschema
export interface MealPlan {
    id: string;
    weekNumber: number;
    year: number;
    days: DayPlan[];
}

export interface Item {
  id: string;
  text: string;
  note?: string;
  checkIfExistAtHome?: boolean;
  completed: boolean;
  state?: "unresolved" | "ongoing" | "completed";
  sectionId?: string;
  isPending?: boolean;
}

export interface Section {
  id: string;
  name: string;
  order: number;
}

export interface Todo {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  isPending?: boolean;
}

export interface ListSettings {
  threeStageMode: boolean;
  defaultSort: "manual" | "alphabetical" | "completed";
  calendarStartTime?: string;
  calendarEndTime?: string;
  pinned?: boolean; // Kept for interface compatibility but logic disabled
  predictionsEnabled?: boolean;
}

export interface List {
  id: string;
  name: string;
  items: Item[];
  sections?: Section[];
  categoryId: string; // Kept for legacy/default support
  order?: number;
  settings?: ListSettings;
  lastAccessedAt?: string;
  archived?: boolean; // Kept for interface compatibility
  isPending?: boolean;
}

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  files?: {
    status: string;
    path: string;
    // Note: The original file had a slightly different structure for files, 
    // but I'll keep it consistent with the provided read_file output.
  }[];
}

// Correcting the Commit interface based on the read_file output
export interface CommitFile {
    status: string;
    path: string;
}

export interface CommitUpdated {
    hash: string;
    author: string;
    date: string;
    message: string;
    files?: CommitFile[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface HistoryItem {
    id: string;
    text: string;
    lastUsed: string;
    usageCount: number;
}

export interface Meal {
    id: string;
    name: string;
    createdAt: string;
    imageUrl?: string;
    description?: string;
    servings?: number;
    tags?: string[];
    ingredients?: {
        text: string;
        amount?: string;
        checkIfExistAtHome?: boolean;
    }[];
    instructions?: string[];
}

export interface QuickItem {
    key: string;
    emoji: string;
    label: string;
}

export interface QuickItemsSettings {
    id: string;
    enabledItems: string[];
}

export interface WhatsNewState {
    lastSeenHash: string;
}

export interface SavedDebugInfo {
    id: string;
    userId: string;
    title: string;
    deviceInfo: {
        screenWidth: number;
        screenHeight: number;
        windowWidth: number;
        windowHeight: number;
        devicePixelRatio: number;
        userAgent: string;
        platform: string;
        isMobile: boolean;
        isTablet: boolean;
        browserName: string;
        browserVersion: string;
        osName: string;
        osVersion: string;
        modelName: string;
        manufacturer: string;
        timeZone: string;
        language: string;
        cpuCores: number | null;
        touchSupport: boolean;
        isOnline: boolean;
    };
    createdAt: string;
}

export interface AIModelOption {
    id: string;
    name: string;
    description: string;
    badge?: string;
    performanceIndex?: number;
    isOnline?: boolean;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const DEFAULT_GEMINI_MODELS: AIModelOption[] = [
    {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        badge: 'Toppval',
        performanceIndex: 9.8,
        description: 'Senaste generationen. Blixtsnabb, högsta precision och bäst på kreativa recept.',
    },
    {
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash',
        badge: 'Snabb & modern',
        performanceIndex: 9.4,
        description: 'Modern och snabb modell optimerad för balanserad receptgenerering.',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        badge: 'Resonemang',
        performanceIndex: 8.2,
        description: 'Hög resonemangsförmåga för komplexa instruktioner och detaljrika rätter.',
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        badge: 'Stabil',
        performanceIndex: 8.0,
        description: 'Beprövad standardmodell med jämn leverans av klassiska vardagsrecept.',
    },
];