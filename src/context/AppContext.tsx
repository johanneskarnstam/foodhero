import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { List, Item, Todo, ListSettings, Section, Category, HistoryItem, MealPlan, Meal, QuickItemsSettings } from '../types';
import { DEFAULT_ENABLED_QUICK_ITEMS } from '../utils/quickItems';

type Priority = 'low' | 'medium' | 'high';
import { useToast } from './ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useFirestoreSync } from '../hooks/useFirestoreSync';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface AppContextType {
    mealPlans: MealPlan[];
    addMealPlan: (plan: MealPlan) => Promise<void>;
    updateMealPlan: (id: string, updates: Partial<MealPlan>) => Promise<void>;
    lists: List[]; // Keep lists array for now but we only use one
    defaultListId: string | undefined; // Helper to get the main list
    theme: 'light' | 'dark' | 'system';
    
    // Quick Items Settings
    quickItemsSettings: QuickItemsSettings;
    updateQuickItemsSettings: (settings: Omit<QuickItemsSettings, 'id'>) => Promise<void>;
    
    // Core List Operations
    updateListName: (id: string, name: string) => Promise<void>;
    updateListSettings: (id: string, settings: ListSettings) => Promise<void>;
    updateListItems: (listId: string, items: Item[], sections?: Section[]) => Promise<void>;
    addItemsToList: (listId: string, items: Item[]) => Promise<void>;
    deleteItem: (listId: string, itemId: string) => Promise<void>;
    
    // Theme
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    
    // Todos
    todos: Todo[];
    addTodo: (title: string, content: string, priority: Priority) => Promise<void>;
    updateTodo: (id: string, title: string, content: string, priority: Priority) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    
    
    // Loading & Sync
    loading: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    
    // Access
    updateListAccess: (id: string) => Promise<void>;
    
    // Sections
    addSection: (listId: string, name: string) => Promise<void>;
    updateSection: (listId: string, sectionId: string, name: string) => Promise<void>;
    deleteSection: (listId: string, sectionId: string) => Promise<void>;

    // Categories
    categories: Category[];
    
    // Archiving
    archiveList: (id: string, archived: boolean) => Promise<void>;

    // Lists
    addList: (name: string, categoryId: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;

    // Categories
    addCategory: (name: string) => Promise<string>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    reorderCategories: (orderedIds: string[]) => Promise<void>;

    // History
    itemHistory: HistoryItem[];
    addToHistory: (text: string) => Promise<void>;
    updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => Promise<void>;
    deleteFromHistory: (id: string) => Promise<void>;
    clearAllHistory: () => Promise<void>;

    // Meals
    meals: Meal[];
    addMeal: (name: string, extraData?: Partial<Meal>) => Promise<string | void>;
    updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
    deleteMeal: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Global application state provider.
 * Manages data synchronization with Firestore, theme settings, 
 * and core business logic for the single grocery list.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const listsSync = useFirestoreSync<List>('users/{uid}/lists', user?.uid);
    const todosSync = useFirestoreSync<Todo>('users/{uid}/notes', user?.uid);
    const categoriesSync = useFirestoreSync<Category>('users/{uid}/categories', user?.uid);
    const historySync = useFirestoreSync<HistoryItem>('users/{uid}/history', user?.uid);
    const mealPlansSync = useFirestoreSync<MealPlan>('users/{uid}/mealplans', user?.uid);
    const mealsSync = useFirestoreSync<Meal>('users/{uid}/meals', user?.uid);
    const quickItemsSync = useFirestoreSync<QuickItemsSettings>('users/{uid}/quickItemsSettings', user?.uid);

    const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [isCreatingDefault, setIsCreatingDefault] = React.useState(false);

    useEffect(() => {
        if (!listsSync.loading && listsSync.data.length === 0 && user?.uid && !isCreatingDefault) {

            const createDefaultList = async () => {
                setIsCreatingDefault(true);
                try {
                    const id = uuidv4();
                      await listsSync.addItem({
                          id,
                          name: t('lists.groceryList', 'Inköpslista'),
                          categoryId: 'default', // Legacy requirement
                          items: [],
                          lastAccessedAt: new Date().toISOString(),
                          settings: {
                              defaultSort: 'manual',
                              threeStageMode: false
                          }
                      });
                } finally {
                    setIsCreatingDefault(false);
                }
            };
            createDefaultList();
        }
    }, [listsSync.loading, listsSync.data.length, user?.uid, listsSync.addItem, t, isCreatingDefault]);

    useEffect(() => {
        const applyTheme = () => {
            if (theme === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } else if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
        if (savedTheme) {
            setThemeState(savedTheme);
        } else {
            const manualTheme = localStorage.getItem('manual_theme');
            if (!manualTheme) {
                try {
                    // Use Europe/Stockholm time
                    const formatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Europe/Stockholm',
                        hour: 'numeric',
                        hour12: false
                    });

                    const hour = parseInt(formatter.format(new Date()), 10);

                    // Light mode between 08:00 and 18:00
                    const isDay = hour >= 8 && hour < 18;
                    setThemeState(isDay ? 'light' : 'dark');
                } catch (error) {
                    console.error("Error setting time-based theme:", error);
                    const hour = new Date().getHours();
                    const isDay = hour >= 8 && hour < 18;
                    setThemeState(isDay ? 'light' : 'dark');
                }
            } else {
                setThemeState('system');
            }
        }
    }, []);

    const updateListName = async (id: string, name: string) => {
        await listsSync.updateItem(id, { name });
    };

    const updateListSettings = async (id: string, settings: ListSettings) => {
        await listsSync.updateItem(id, { settings });
    };

    const updateListAccess = async (id: string) => {
        const list = listsSync.data.find((l: List) => l.id === id);
        if (list) {
            const lastAccessed = list.lastAccessedAt ? new Date(list.lastAccessedAt).getTime() : 0;
            const now = Date.now();
            // Only update if it's been more than 5 minutes since the last access update
            if (now - lastAccessed > 300000) {
                 await listsSync.updateItem(id, { lastAccessedAt: new Date().toISOString() });
            }
        }
    };

    const updateListItems = async (listId: string, items: Item[], sections?: Section[]) => {
        if (sections) {
            await listsSync.updateItem(listId, { items, sections });
        } else {
            await listsSync.updateItem(listId, { items });
        }
    };

    const addItemsToList = async (listId: string, newItems: Item[]) => {
        const list = listsSync.data.find((l: List) => l.id === listId);
        if (list) {
            const existingTexts = new Set(list.items.map(item => item.text.toLowerCase().trim()));
            const filteredNewItems = newItems.filter(item => 
                !existingTexts.has(item.text.toLowerCase().trim())
            );

            if (filteredNewItems.length === 0) return;

            const updatedItems = [...filteredNewItems, ...list.items];
            await updateListItems(listId, updatedItems);
        }
    };

    const deleteItem = async (listId: string, itemId: string) => {
        const list = listsSync.data.find((l: List) => l.id === listId);
        if (list) {
            const itemToDelete = list.items.find((i: Item) => i.id === itemId);
            if (itemToDelete) {
                const newItems = list.items.filter((i: Item) => i.id !== itemId);
                await updateListItems(listId, newItems);

                showToast(t('toasts.itemDeleted'), 'info', {
                    label: t('common.undo'),
                    onClick: async () => {
                        const currentList = listsSync.data.find((l: List) => l.id === listId);
                        if (currentList) {
                            await updateListItems(listId, [...currentList.items, itemToDelete]);
                        }
                    }
                });
            }
        }
    };

    const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        localStorage.setItem('manual_theme', 'true');
    };

    const toggleTheme = () => {
        setThemeState((prev) => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            localStorage.setItem('manual_theme', 'true');
            return newTheme;
        });
    };

    const addTodo = async (title: string, content: string, priority: Priority) => {
        const newTodo: Todo = {
            id: uuidv4(),
            title,
            content,
            createdAt: new Date().toISOString(),
            priority,
            completed: false, 
        };
        await todosSync.addItem(newTodo);
    };

    const updateTodo = async (id: string, title: string, content: string, priority: Priority) => {
        await todosSync.updateItem(id, { title, content, priority });
    };

    const toggleTodo = async (id: string) => {
        const todo = todosSync.data.find((t: Todo) => t.id === id);
        if (todo) {
            await todosSync.updateItem(id, { completed: !todo.completed });
        }
    };

    const deleteTodo = async (id: string) => {
        await todosSync.deleteItem(id);
    };

    const addSection = async (listId: string, name: string) => {
        const list = listsSync.data.find((l: List) => l.id === listId);
        if (list) {
            const sections = list.sections || [];
            const newSection: Section = {
                id: uuidv4(),
                name,
                order: 0
            };

            const updatedSections = [newSection, ...sections].map((section, index) => ({
                ...section,
                order: index
            }));

            await listsSync.updateItem(listId, { sections: updatedSections });
        }
    };

    const updateSection = async (listId: string, sectionId: string, name: string) => {
        const list = listsSync.data.find((l: List) => l.id === listId);
        if (list && list.sections) {
            const updatedSections = list.sections.map(section =>
                section.id === sectionId ? { ...section, name } : section
            );
            await listsSync.updateItem(listId, { sections: updatedSections });
        }
    };

    const deleteSection = async (listId: string, sectionId: string) => {
        const list = listsSync.data.find((l: List) => l.id === listId);
        if (list) {
            const updatedSections = (list.sections || []).filter(s => s.id !== sectionId);
            const updatedItems = list.items.map(item => {
                if (item.sectionId !== sectionId) return item;
                const newItem = { ...item };
                delete newItem.sectionId;
                return newItem;
            });

            await listsSync.updateItem(listId, {
                sections: updatedSections,
                items: updatedItems
            });
        }
    };

    const addMealPlan = async (plan: MealPlan) => {
        await mealPlansSync.addItem(plan);
    };

    const updateMealPlan = async (id: string, updates: Partial<MealPlan>) => {
        await mealPlansSync.updateItem(id, updates);
    };

    const archiveList = async (id: string, archived: boolean = true) => {
        await listsSync.updateItem(id, { archived });
    };

    const addList = async (name: string, categoryId: string) => {
        await listsSync.addItem({
            id: uuidv4(),
            name,
            categoryId,
            items: [],
            lastAccessedAt: new Date().toISOString()
        });
    };

    const deleteList = async (id: string) => {
        await listsSync.deleteItem(id);
    };

    const addCategory = async (name: string) => {
        const id = uuidv4();
        await categoriesSync.addItem({
            id,
            name,
            order: categoriesSync.data.length
        });
        return id;
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await categoriesSync.updateItem(id, updates);
    };

    const deleteCategory = async (id: string) => {
        await categoriesSync.deleteItem(id);
    };

    const reorderCategories = async (orderedIds: string[]) => {
        await Promise.all(
            orderedIds.map((id, index) => categoriesSync.updateItem(id, { order: index }))
        );
    };

    const addToHistory = async (text: string) => {
        const normalizedText = text.trim();
        if (!normalizedText) return;

        const existingItem = historySync.data.find(
            item => item.text.toLowerCase() === normalizedText.toLowerCase()
        );

        if (existingItem) {
            await historySync.updateItem(existingItem.id, {
                lastUsed: new Date().toISOString(),
                usageCount: (existingItem.usageCount || 1) + 1
            });
        } else {
            await historySync.addItem({
                id: uuidv4(),
                text: normalizedText,
                lastUsed: new Date().toISOString(),
                usageCount: 1
            });
        }
    };

    const updateHistoryItem = async (id: string, updates: Partial<HistoryItem>) => {
        await historySync.updateItem(id, updates);
    };

    const deleteFromHistory = async (id: string) => {
        await historySync.deleteItem(id);
    };

    const clearAllHistory = async () => {
        const deletePromises = historySync.data.map(item => 
            historySync.deleteItem(item.id)
        );
        await Promise.all(deletePromises);
    };

    const addMeal = async (name: string, extraData?: Partial<Meal>) => {
        const id = uuidv4();
        await mealsSync.addItem({
            id,
            name,
            createdAt: new Date().toISOString(),
            ...extraData
        });
        return id;
    };

    const updateMeal = async (id: string, updates: Partial<Meal>) => {
        await mealsSync.updateItem(id, updates);
    };

    const deleteMeal = async (id: string) => {
        await mealsSync.deleteItem(id);
    };

    const updateQuickItemsSettings = async (settings: Omit<QuickItemsSettings, 'id'>) => {
        if (quickItemsSync.data.length === 0) {
            // Create new settings document
            await quickItemsSync.addItem({
                id: 'quickItemsSettings',
                enabledItems: settings.enabledItems
            });
        } else {
            // Update existing settings
            await quickItemsSync.updateItem('quickItemsSettings', settings);
        }
    };

    // Get quick items settings with defaults
    const quickItemsSettings: QuickItemsSettings = quickItemsSync.data.length > 0 
        ? quickItemsSync.data[0]
        : { id: 'quickItemsSettings', enabledItems: DEFAULT_ENABLED_QUICK_ITEMS };

    const defaultListId = listsSync.data.length > 0 ? listsSync.data[0].id : undefined;

    const pendingChanges = [
        ...listsSync.data,
        ...todosSync.data,
        ...categoriesSync.data,
        ...historySync.data,
        ...mealPlansSync.data,
        ...mealsSync.data,
        ...quickItemsSync.data
    ].filter(item => (item as { isPending?: boolean }).isPending).length;
    const isSyncing = pendingChanges > 0;

    return (
        <AppContext.Provider
            value={{
                mealPlans: mealPlansSync.data,
                addMealPlan,
                updateMealPlan,
                lists: listsSync.data,
                defaultListId,
                theme,
                setTheme,
                updateListName,
                updateListSettings,
                updateListItems,
                addItemsToList,
                deleteItem,
                toggleTheme,
                todos: todosSync.data,
                addTodo,
                updateTodo,
                toggleTodo,
                deleteTodo,
                loading: listsSync.loading || todosSync.loading || isCreatingDefault,
                isSyncing,
                pendingChanges,
                updateListAccess,
                addSection,
                updateSection,
                deleteSection,
                categories: [...categoriesSync.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
                archiveList,
                addList,
                deleteList,
                addCategory,
                updateCategory,
                deleteCategory,
                reorderCategories,
                itemHistory: historySync.data,
                addToHistory,
                updateHistoryItem,
                deleteFromHistory,
                clearAllHistory,
                meals: mealsSync.data,
                addMeal,
                updateMeal,
                deleteMeal,
                quickItemsSettings,
                updateQuickItemsSettings,
            }}
        >
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
