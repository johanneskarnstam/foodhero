import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Item, List, Meal, PlannedMeal } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Plus, RotateCcw, ChevronDown, CloudUpload, Mic, Trash2, Utensils, Braces, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Confetti } from './Confetti';
import { convertToItems } from '../utils/importUtils';
import { ImportItemsModal } from './ImportItemsModal';
import { Modal } from './Modal';
import { MealDetailModal } from './MealDetailModal';
import { MealEditModal } from './MealEditModal';
import { ConfirmModal } from './ConfirmModal';
import { useTranslation } from 'react-i18next';
import { InlineAutocompleteInput } from './InlineAutocompleteInput';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useMealPlan } from '../hooks/useMealPlan';
import { formatDate } from '../utils/dateUtils';

interface OutletContext {
    isMoreOpen: boolean;
}

export const GroceryListView: React.FC = React.memo(function GroceryListView() {
    const { isMoreOpen = false } = useOutletContext<OutletContext>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { meals, lists, defaultListId, updateListItems, deleteItem, updateListAccess, loading, itemHistory, addToHistory, updateMeal, deleteMeal } = useApp();
    const { showToast } = useToast();
    const { getPlanForDate } = useMealPlan();
    const { isListening, transcript, startListening, stopListening, hasSupport } = useVoiceInput();
    const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [deleteConfirmMeal, setDeleteConfirmMeal] = useState<Meal | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [suggestions, setSuggestions] = useState<(typeof itemHistory)>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [completedAccordionOpen, setCompletedAccordionOpen] = useState(false);
    const [clearCompletedModalOpen, setClearCompletedModalOpen] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);

    const list: List | undefined = lists.find((l) => l.id === defaultListId);

    React.useEffect(() => {
        if (list) {
            document.title = `BuyMilk - ${t('lists.groceryTitle')}`;
            updateListAccess(list.id);
        }
    }, [list?.id, t, updateListAccess]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [sortBy, setSortBy] = useState<'manual' | 'alphabetical' | 'completed'>('manual');

    useEffect(() => {
        if (list?.settings?.defaultSort) {
            setSortBy(list.settings.defaultSort);
        }
    }, [list?.settings?.defaultSort]);

    const sortedItems = React.useMemo(() => {
        if (!list) return [];
        const items = [...list.items];
        if (sortBy === 'alphabetical') {
            items.sort((a, b) => a.text.localeCompare(b.text));
        } else if (sortBy === 'completed') {
            items.sort((a, b) => {
                const getWeight = (item: Item) => (item.completed ? 2 : 1);
                const weightA = getWeight(a);
                const weightB = getWeight(b);
                if (weightA !== weightB) return weightA - weightB;
                return a.text.localeCompare(b.text);
            });
        }
        return items;
    }, [list, sortBy]);

    // Autocomplete Logic
    useEffect(() => {
        if (transcript) {
            setNewItemText(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        if (!newItemText.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const searchText = newItemText.toLowerCase();
        
        // Filter history
        const historyMatches = itemHistory.filter(h => 
            h.text.toLowerCase().includes(searchText)
        );

        // Sort by usage count
        historyMatches.sort((a, b) => b.usageCount - a.usageCount);

        setSuggestions(historyMatches.slice(0, 5));
        setShowSuggestions(true);
    }, [newItemText, itemHistory]);

    // Next Meal Banner Logic
    const { nextMeals, nextMealLabel } = React.useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const isAfterEveningCutoff = hour > 19 || (hour === 19 && minute >= 30);
        
        const targetDate = new Date(now);
        let label = t('meals.nextMeal', 'Nästa måltid');

        if (isAfterEveningCutoff) {
            targetDate.setDate(targetDate.getDate() + 1);
            label = t('meals.tomorrow', 'Imorgon');
        }

        const plan = getPlanForDate(targetDate);
        if (!plan) return { nextMeals: [], nextMealLabel: label };

        const dateStr = formatDate(targetDate);
        const day = plan.days.find(d => d.date === dateStr);
        if (!day) return { nextMeals: [], nextMealLabel: label };

        let meals: { type: string; title: string; meal: PlannedMeal }[] = [];
        if (isAfterEveningCutoff) {
            // Show all meals for tomorrow
            meals = day.meals.map(m => ({
                type: m.type,
                title: m.plannedMeal.customTitle || '',
                meal: m.plannedMeal
            })).filter(m => m.title);
        } else if (hour < 14) {
            // Show all meals for today
            meals = day.meals.map(m => ({
                type: m.type,
                title: m.plannedMeal.customTitle || '',
                meal: m.plannedMeal
            })).filter(m => m.title);
        } else {
            // Show only dinner for today
            const dinner = day.meals.find(m => m.type === 'dinner');
            if (dinner && dinner.plannedMeal.customTitle) {
                meals = [{ type: 'dinner', title: dinner.plannedMeal.customTitle, meal: dinner.plannedMeal }];
            }
        }
        
        return { nextMeals: meals, nextMealLabel: label };
    }, [getPlanForDate, t]);

    if (loading && !list) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    }

    if (!list) return <div className="text-center py-10">{t('lists.notFound')}</div>;

    const handleAddItem = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const rawText = (textOverride || newItemText).trim();
        
        if (list && rawText) {
            try {
                const isCheckHome = rawText.startsWith('?');
                const textToAdd = isCheckHome ? rawText.replace(/^\?+\s*/, '').trim() : rawText;
                if (!textToAdd) return;

                // Check if item exists (completed) -> Restore it
                const normalize = (s: string) => s.trim().toLowerCase().normalize("NFC");
                const existingItem = list.items.find(i => normalize(i.text) === normalize(textToAdd));
            
                if (existingItem) {
                    if (existingItem.completed) {
                        // Clear input immediately for "Optimistic" feel
                        setNewItemText('');
                        setSuggestions([]);
                        setShowSuggestions(false);
                        const newItems = list.items.map(i =>
                            i.id === existingItem.id ? { ...i, completed: false, checkIfExistAtHome: isCheckHome ? true : i.checkIfExistAtHome } : i
                        );
                        await updateListItems(list.id, newItems);
                    } else {
                        if (isCheckHome && !existingItem.checkIfExistAtHome) {
                            const newItems = list.items.map(i =>
                                i.id === existingItem.id ? { ...i, checkIfExistAtHome: true } : i
                            );
                            await updateListItems(list.id, newItems);
                            setNewItemText('');
                            setSuggestions([]);
                            setShowSuggestions(false);
                        } else {
                            // Item exists and is active - notify user
                            showToast(t('lists.itemExists', 'Item is already in the list'), 'info');
                        }
                    }
                } else {
                    // Clear input immediately for "Optimistic" feel
                    setNewItemText('');
                    setSuggestions([]);
                    setShowSuggestions(false);

                     const newItem: Item = { 
                         id: uuidv4(), 
                         text: textToAdd, 
                         completed: false,
                         checkIfExistAtHome: isCheckHome ? true : undefined,
                     };
                     await updateListItems(list.id, [newItem, ...list.items]);
                     await addToHistory(textToAdd);
                }
            } catch (error) {
                console.error("Failed to add item:", error);
            }
        }
    };

    const handleSuggestionClick = (text: string) => {
        handleAddItem(undefined, text);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = list.items.findIndex((item) => item.id === active.id);
        const newIndex = list.items.findIndex((item) => item.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            await updateListItems(list.id, arrayMove(list.items, oldIndex, newIndex));
        }
    };

    const handleToggle = async (itemId: string) => {
        const newItems = list.items.map(item => {
            if (item.id !== itemId) return item;
            const newCompleted = !item.completed;
            return { ...item, completed: newCompleted };
        });
        await updateListItems(list.id, newItems);

        const allCompleted = newItems.every(item => item.completed);
        if (allCompleted && newItems.length > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
        }
    };

    const handleDelete = async (itemId: string) => {
        await deleteItem(list.id, itemId);
    };

    const confirmClearCompleted = async () => {
        const newItems = list.items.filter(item => !item.completed);
        await updateListItems(list.id, newItems);
        setClearCompletedModalOpen(false);
    };

    const handleEdit = async (itemId: string, text: string) => {
        const newItems = list.items.map(item =>
            item.id === itemId ? { ...item, text } : item
        );
        await updateListItems(list.id, newItems);
    };

    const handleEditNote = async (itemId: string, note?: string) => {
        const newItems = list.items.map(item =>
            item.id === itemId ? { ...item, note: note || undefined } : item
        );
        await updateListItems(list.id, newItems);
    };

    const handleTogglecheckIfExistAtHome = async (itemId: string) => {
        const newItems = list.items.map(item =>
            item.id === itemId ? { ...item, checkIfExistAtHome: !item.checkIfExistAtHome } : item
        );
        await updateListItems(list.id, newItems);
    };

    const handleSaveMeal = async (mealData: Partial<Meal> & { name: string }, mealId?: string) => {
        try {
            if (mealId) {
                await updateMeal(mealId, mealData);
            }
            setEditingMeal(null);
            showToast(t('toasts.itemUpdated', 'Måltid uppdaterad'), 'success');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        }
    };

    const handleDeleteMeal = (meal: Meal) => {
        setDeleteConfirmMeal(meal);
    };

    const confirmDeleteMeal = async () => {
        if (!deleteConfirmMeal) return;
        
        try {
            await deleteMeal(deleteConfirmMeal.id);
            if (viewingMeal?.id === deleteConfirmMeal.id) setViewingMeal(null);
            showToast(t('toasts.itemDeleted', 'Måltid borttagen'), 'info');
        } catch {
            showToast(t('toasts.error', 'Ett fel uppstod'), 'error');
        } finally {
            setDeleteConfirmMeal(null);
        }
    };

    const handleImportItems = async (items: (string | { text: string; note?: string; checkIfExistAtHome?: boolean })[]) => {
        if (!list) return;
        
        // Normalize items to ParsedImportItem format for the utility
        const normalizedItems = items.map(entry => {
            if (typeof entry === 'string') {
                const trimmed = entry.trim();
                const isCheck = trimmed.startsWith('?');
                return { 
                    text: isCheck ? trimmed.replace(/^\?+\s*/, '') : trimmed, 
                    checkIfExistAtHome: isCheck ? true : undefined 
                };
            }
            return entry;
        });

                      const newItems = convertToItems(normalizedItems);
                      
                      await updateListItems(list.id, [...newItems, ...list.items]);
        
        // Process history updates in parallel and don't block the modal closure
        const historyPromises = items.map(entry => {
            const raw = typeof entry === 'string' ? entry : entry.text;
            const txt = raw.replace(/^\?+\s*/, '').trim();
            return txt ? addToHistory(txt) : Promise.resolve();
        });
        
        Promise.all(historyPromises).catch(err => console.error("Failed to update history:", err));
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)] relative pb-40 md:pb-32 z-0">
            <ImportItemsModal 
                isOpen={importModalOpen} 
                onClose={() => setImportModalOpen(false)} 
                onImport={handleImportItems}
                existingItemTexts={list?.items.map(i => i.text.toLowerCase()) || []}
            />
            {showConfetti && <Confetti trigger={true} />}
            {nextMeals.length > 0 && (
                <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                    <div className="p-2 flex items-start gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg flex-shrink-0">
                            <Utensils size={16} />
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    {nextMealLabel}
                                </span>
                                <button
                                    onClick={() => navigate('/mealplan')}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-0.5"
                                >
                                    {t('nav.viewMealPlan', 'Visa matsedeln')}
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                {nextMeals.map((meal, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            const fullMeal = meals.find(m =>
                                                m.id === meal.meal.id ||
                                                m.name.toLowerCase() === meal.title.toLowerCase()
                                            );
                                            if (fullMeal) setViewingMeal(fullMeal);
                                        }}
                                        className="text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <span className="opacity-60 capitalize">{meal.type === 'dinner' ? t('meals.dinner', 'Middag') : meal.type === 'lunch' ? t('meals.lunch', 'Lunch') : t('meals.snack', 'Mellanmål')}: </span>
                                        <span className="underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700">{meal.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 group min-w-0 flex-1 relative">
                        <h2 className="text-xl font-semibold truncate">{t('lists.groceryTitle')}</h2>
                        {list.isPending && (
                            <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-blue-500 animate-in fade-in duration-300 z-10" title="Syncing list...">
                                <CloudUpload size={20} />
                            </div>
                        )}
                    </div>
                        <button 
                            onClick={() => setImportModalOpen(true)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title={t('categories.importJSON', 'Importera JSON')}
                            aria-label={t('categories.importJSON', 'Importera JSON')}
                        >
                                <Braces size={18} />
                        </button>
                    </div>
            </div>

            <Modal
                isOpen={clearCompletedModalOpen}
                onClose={() => setClearCompletedModalOpen(false)}
                onConfirm={confirmClearCompleted}
                title={t('lists.clearCompletedTitle')}
                message={t('lists.clearCompletedMessage')}
                confirmText={t('common.delete')}
                isDestructive={true}
            />
            <MealDetailModal 
                isOpen={!!viewingMeal}
                onClose={() => setViewingMeal(null)}
                onEdit={(meal) => {
                    setViewingMeal(null);
                    setEditingMeal(meal);
                }}
                onPlanMeal={() => {}}
                onRandomMeal={() => {}}
                onDelete={handleDeleteMeal}
                meal={viewingMeal}
            />

            <ConfirmModal
                isOpen={!!deleteConfirmMeal}
                onClose={() => setDeleteConfirmMeal(null)}
                onConfirm={confirmDeleteMeal}
                title={t('meals.deleteMeal', 'Ta bort måltid')}
                message={t('meals.deleteMealConfirm', 'Är du säker på att du vill ta bort detta recept? Denna åtgärd kan inte ångras.')}
                confirmText={t('common.delete', 'Ta bort')}
                cancelText={t('common.cancel', 'Avbryt')}
                isDestructive={true}
            />

            <MealEditModal 
                isOpen={!!editingMeal}
                onClose={() => setEditingMeal(null)}
                onSave={handleSaveMeal}
                meal={editingMeal}
            />


            {/* Active Items */}
            {(() => {
                const activeItems = sortedItems.filter(i => !i.completed);
                const completedItems = sortedItems.filter(i => i.completed);

                return (
                    <>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={activeItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {activeItems.map((item) => (
                                        <SortableItem
                                            key={item.id}
                                            item={{ ...item, isPending: item.isPending || list.isPending }}
                                            onToggle={handleToggle}
                                            onDelete={handleDelete}
                                            onEdit={handleEdit}
                                            onEditNote={handleEditNote}
                                            onTogglecheckIfExistAtHome={handleTogglecheckIfExistAtHome}
                                            onEditingChange={setIsEditingItem}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {activeItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <Plus className="text-gray-400" size={32} />
                                </div>
                                <p className="text-gray-500 font-medium">{t('lists.emptyList')}</p>
                            </div>
                        )}

                        {/* Completed Items Accordion */}
                        {completedItems.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setCompletedAccordionOpen(!completedAccordionOpen)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <ChevronDown size={16} className={`transition-transform ${completedAccordionOpen ? 'rotate-180' : ''}`} />
                                        {t('lists.completedItems', 'Completed Items')} ({completedItems.length})
                                    </button>
                                    <button
                                        onClick={() => setClearCompletedModalOpen(true)}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                        {t('lists.clearCompleted')}
                                    </button>
                                </div>

                                {completedAccordionOpen && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        {completedItems.map(item => (
                                            <div key={item.id} className="opacity-60 hover:opacity-100 transition-opacity">
                                                <SortableItem
                                                    item={{ ...item, isPending: item.isPending || list.isPending }}
                                                    onToggle={handleToggle}
                                                    onDelete={handleDelete}
                                                    onEdit={handleEdit}
                                                    onEditNote={handleEditNote}
                                                    onTogglecheckIfExistAtHome={handleTogglecheckIfExistAtHome}
                                                    onEditingChange={setIsEditingItem}
                                                    disabled={true}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                );
            })()}


            {/* Floating Persistent Bottom Bar */}
            {!importModalOpen && document.body && !isMoreOpen && !isEditingItem && createPortal(
                <div className="fixed bottom-[50px] left-0 right-0 md:left-72 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/0 pt-10 pb-6 px-4 z-[99] transition-all duration-300 pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                            <div className="relative group">
                                <form onSubmit={handleAddItem} className="flex gap-3 items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                                    <div className="relative flex-1">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" size={20} />
                                        <InlineAutocompleteInput
                                            value={newItemText}
                                            onChange={setNewItemText}
                                            onSubmit={() => handleAddItem()}
                                            suggestions={suggestions}
                                            placeholder={t('lists.addItemPlaceholder')}
                                            className="w-full pl-10 pr-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none font-medium"
                                            inputPaddingClass="pl-10"
                                        />
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute bottom-full left-0 right-0 mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
                                                {suggestions.map((suggestion) => {
                                                    const normalize = (s: string) => s.trim().toLowerCase().normalize("NFC");
                                                    const existingItem = list?.items.find(i => normalize(i.text) === normalize(suggestion.text));
                                                    const isCompleted = existingItem?.completed;
                                                    const isActive = existingItem && !isCompleted;
                                                    
                                                    return (
                                                        <button
                                                            key={suggestion.id}
                                                            type="button"
                                                            onClick={() => handleSuggestionClick(suggestion.text)}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between group transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <RotateCcw size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                                <span className={`font-medium ${isActive ? 'text-gray-400 dark:text-gray-500 decoration-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                    {suggestion.text}
                                                                </span>
                                                            </div>
                                                            {isCompleted && (
                                                                <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                                    {t('lists.restore', 'Restore')}
                                                                </span>
                                                            )}
                                                            {isActive && (
                                                                <span className="text-[10px] text-green-600 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                                    {t('lists.added', 'Added')}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                     <div className="flex gap-2">
                                         {hasSupport && (
                                             <button
                                                 type="button"
                                                 onClick={isListening ? stopListening : startListening}
                                                 className={`p-3 rounded-xl transition-all active:scale-95 ${
                                                     isListening 
                                                     ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25' 
                                                     : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                 }`}
                                                 title={isListening ? t('lists.stopListening', 'Stop Listening') : t('lists.startListening', 'Voice Input')}
                                             >
                                                 <Mic size={22} strokeWidth={2.5} />
                                             </button>
                                         )}
                                         <button
                                             type="submit"
                                             disabled={!newItemText.trim()}
                                             className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                         >
                                             <Plus size={22} strokeWidth={2.5} />
                                         </button>
                                     </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                document.body
            )}

        </div>
    );
});
