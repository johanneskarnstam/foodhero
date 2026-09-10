import React, { useState, useEffect } from 'react';
import { Meal } from '../types';
import { 
    X, 
    Utensils, 
    BookOpen, 
    Plus, 
    Trash2, 
    FileText, 
    Check, 
    Sparkles,
    ChefHat,
    Image,
    Users,
    Download,
    Upload,
    RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { JsonExportModal } from './JsonExportModal';
import { JsonImportModal } from './JsonImportModal';
import { useAiRecipe } from '../hooks/useAiRecipe';

interface MealEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (mealData: Partial<Meal> & { name: string }, mealId?: string) => Promise<void> | void;
    meal: Meal | null;
}

const POPULAR_TAGS = [
    'Snabbt', 'Vegetariskt', 'Pasta', 'Kött', 'Fisk', 
    'Kyckling', 'Barnvänligt', 'Asiatiskt', 'Klassiker', 'Husman', 'Gryta'
];

export const parseIngredientLine = (line: string): { text: string; amount?: string; checkIfExistAtHome?: boolean } => {
    const trimmed = line.trim();
    if (!trimmed) return { text: '' };

    // Common quantity patterns at start of line: "500g", "2 st", "1 tsk", "2 msk", "3 dl", "1 förp", "400 g"
    const match = trimmed.match(/^([\d/.,-]+\s*(?:st|g|kg|dl|cl|ml|l|msk|tsk|krm|förp|burk|paket|klyftor|klyfta|skivor|skiva|nypa|port)?)\s+(.+)$/i);
    if (match) {
        return {
            amount: match[1].trim(),
            text: match[2].trim(),
            checkIfExistAtHome: false
        };
    }
    return {
        text: trimmed,
        amount: '',
        checkIfExistAtHome: false
    };
};

export const MealEditModal: React.FC<MealEditModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    meal 
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'basic' | 'ingredients' | 'instructions'>('basic');
    const { isLoading: isAiLoading, enrichMeal } = useAiRecipe();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [servings, setServings] = useState<string>('4');
    const [tagList, setTagList] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    
    const [ingredients, setIngredients] = useState<{ text: string; amount?: string; checkIfExistAtHome?: boolean }[]>([]);
    const [rawImportText, setRawImportText] = useState('');
    const [showRawImport, setShowRawImport] = useState(false);
    
    const [instructions, setInstructions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // JSON Import/Export state
    const [showJsonExport, setShowJsonExport] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (meal) {
                setName(meal.name || '');
                setDescription(meal.description || '');
                setImageUrl(meal.imageUrl || '');
                setServings(meal.servings ? meal.servings.toString() : '4');
                setTagList(meal.tags || []);
                setIngredients(meal.ingredients ? meal.ingredients.map(i => ({ ...i })) : []);
                setInstructions(meal.instructions ? [...meal.instructions] : []);
            } else {
                setName('');
                setDescription('');
                setImageUrl('');
                setServings('4');
                setTagList([]);
                setIngredients([]);
                setInstructions([]);
            }
            setActiveTab('basic');
            setShowRawImport(false);
            setRawImportText('');
            setTagInput('');
        }
    }, [isOpen, meal]);

    if (!isOpen) return null;

    const handleToggleTag = (tag: string) => {
        setTagList(prev => 
            prev.some(t => t.toLowerCase() === tag.toLowerCase())
                ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
                : [...prev, tag]
        );
    };

    const handleAddCustomTag = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tagInput.trim();
        if (trimmed && !tagList.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            setTagList(prev => [...prev, trimmed]);
            setTagInput('');
        }
    };

    const handleAddIngredientRow = () => {
        setIngredients(prev => [...prev, { text: '', amount: '', checkIfExistAtHome: false }]);
    };

    const handleUpdateIngredient = (index: number, updates: Partial<{ text: string; amount?: string; checkIfExistAtHome?: boolean }>) => {
        setIngredients(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleImportPastedIngredients = () => {
        if (!rawImportText.trim()) return;
        const lines = rawImportText.split(/\r?\n/);
        const parsed = lines
            .map(parseIngredientLine)
            .filter(item => item.text.length > 0);

        setIngredients(prev => [...prev, ...parsed]);
        setRawImportText('');
        setShowRawImport(false);
    };

    const handleAddInstructionStep = () => {
        setInstructions(prev => [...prev, '']);
    };

    const handleUpdateInstruction = (index: number, value: string) => {
        setInstructions(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleRemoveInstruction = (index: number) => {
        setInstructions(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Berikar receptet med AI baserat på befintligt namn, beskrivning, taggar och portioner.
     * Fyller i ingredienser och/eller instruktioner om de saknas.
     */
    const handleEnrichWithAi = async () => {
        if (!name.trim() || isAiLoading) return;
        const result = await enrichMeal({
            name: name.trim(),
            description: description.trim() || undefined,
            tags: tagList.length > 0 ? tagList : undefined,
            servings: servings ? parseInt(servings, 10) : undefined,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            instructions: instructions.length > 0 ? instructions : undefined,
        });
        if (result) {
            if (result.ingredients.length > 0 && ingredients.length === 0) {
                setIngredients(result.ingredients.map(i => ({
                    text: i.text,
                    amount: i.amount || undefined,
                    checkIfExistAtHome: false,
                })));
            }
            if (result.instructions.length > 0 && instructions.length === 0) {
                setInstructions(result.instructions);
            }
            if (!description && result.description) {
                setDescription(result.description);
            }
        }
    };

    // JSON Import/Export handlers
    const handleJsonImport = (importedData: Partial<Meal>) => {
        // Uppdatera alla fält med importerad data
        if (importedData.name) setName(importedData.name);
        if (importedData.description) setDescription(importedData.description);
        if (importedData.imageUrl) setImageUrl(importedData.imageUrl);
        if (importedData.servings) setServings(importedData.servings.toString());
        if (importedData.tags) setTagList(importedData.tags);
        if (importedData.ingredients) setIngredients(importedData.ingredients);
        if (importedData.instructions) setInstructions(importedData.instructions);
    };

    const handleExportJson = () => {
        setShowJsonExport(true);
    };

    const handleImportJson = () => {
        setShowJsonImport(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setIsSaving(true);
        try {
            const cleanedIngredients = ingredients
                .filter(i => i.text.trim().length > 0)
                .map(i => ({
                    text: i.text.trim(),
                    amount: i.amount?.trim() || undefined,
                    checkIfExistAtHome: !!i.checkIfExistAtHome
                }));

            const cleanedInstructions = instructions
                .map(step => step.trim())
                .filter(step => step.length > 0);

            const payload: Partial<Meal> & { name: string } = {
                name: trimmedName,
                description: description.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                servings: servings ? parseInt(servings, 10) : undefined,
                tags: tagList.length > 0 ? tagList : undefined,
                ingredients: cleanedIngredients,
                instructions: cleanedInstructions
            };

            await onSave(payload, meal?.id);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <ChefHat className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {meal ? t('meals.editRecipeTitle', 'Redigera recept') : t('meals.newRecipeTitle', 'Skapa nytt recept')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {meal ? meal.name : t('meals.basicInfo', 'Fyll i information, ingredienser och tillagning')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-5 gap-2 bg-gray-50/50 dark:bg-gray-900/30">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'basic'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {t('meals.basicInfo', 'Grundinfo')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ingredients')}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'ingredients'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Utensils className="w-3.5 h-3.5" />
                        {t('meals.ingredients', 'Ingredienser')}
                        {ingredients.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-[10px]">
                                {ingredients.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('instructions')}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'instructions'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        {t('meals.instructionsTab', 'Instruktioner')}
                        {instructions.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-[10px]">
                                {instructions.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                    {/* Tab 1: Basic Info */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    {t('common.name', 'Receptnamn')} *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="T.ex. Krämig Kycklingpasta"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    {t('common.description', 'Beskrivning')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Kort beskrivning eller smakprofil..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                        <Image className="w-3.5 h-3.5 text-blue-500" /> {t('common.imageUrl', 'Bild-URL')}
                                    </label>
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-blue-500" /> {t('common.servings', 'Portioner')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={servings}
                                        onChange={(e) => setServings(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    {t('meals.popularTags', 'Taggar')}
                                </label>
                                
                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_TAGS.map(tag => {
                                        const isSelected = tagList.some(t => t.toLowerCase() === tag.toLowerCase());
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => handleToggleTag(tag)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="Lägg till egen tagg..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCustomTag();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddCustomTag()}
                                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {t('common.add', 'Lägg till')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Ingredients */}
                    {activeTab === 'ingredients' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            {/* Toggle Raw Paste Section */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    {t('meals.ingredients', 'Ingredienser')} ({ingredients.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowRawImport(!showRawImport)}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {showRawImport ? 'Dölj klistra in' : t('meals.importText', 'Klistra in ingredienser')}
                                </button>
                            </div>

                            {/* Raw Paste Box */}
                            {showRawImport && (
                                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                                    <label className="text-xs font-medium text-blue-900 dark:text-blue-200">
                                        {t('meals.importTextPlaceholder', 'Klistra in en ingrediens per rad:')}
                                    </label>
                                    <textarea
                                        value={rawImportText}
                                        onChange={(e) => setRawImportText(e.target.value)}
                                        rows={4}
                                        placeholder="500g nötfärs&#10;2 st gula lökar&#10;400g krossade tomater&#10;1 tsk salt"
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleImportPastedIngredients}
                                            disabled={!rawImportText.trim()}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40"
                                        >
                                            {t('meals.importTextButton', 'Importera ingredienser')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Ingredient Items Table/List */}
                            <div className="space-y-2">
                                {ingredients.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <Utensils className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            {t('meals.noIngredients', 'Inga ingredienser tillagda än.')}
                                        </p>
                                        {name.trim() && (
                                            <button
                                                id="meal-edit-enrich-ingredients-btn"
                                                type="button"
                                                onClick={handleEnrichWithAi}
                                                disabled={isAiLoading}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isAiLoading
                                                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />{t('ai.enriching')}</>
                                                    : <><Sparkles className="w-3.5 h-3.5" />{t('ai.enrichWithAi')}</>
                                                }
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    ingredients.map((ing, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                                            <input
                                                type="text"
                                                value={ing.amount || ''}
                                                onChange={(e) => handleUpdateIngredient(index, { amount: e.target.value })}
                                                placeholder="Mängd"
                                                className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            />
                                            <input
                                                type="text"
                                                value={ing.text}
                                                onChange={(e) => handleUpdateIngredient(index, { text: e.target.value })}
                                                placeholder="Ingrediensnamn"
                                                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateIngredient(index, { checkIfExistAtHome: !ing.checkIfExistAtHome })}
                                                title={t('meals.checkAtHome', 'Basvara / Finns hemma')}
                                                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                                    ing.checkIfExistAtHome
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                Basvara
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIngredient(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Ta bort"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}

                                <button
                                    type="button"
                                    onClick={handleAddIngredientRow}
                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors cursor-pointer border border-dashed border-blue-200 dark:border-blue-800"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('meals.addIngredient', 'Lägg till ingrediensrad')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Instructions */}
                    {activeTab === 'instructions' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    {t('meals.instructionsTab', 'Tillagningssteg')} ({instructions.length})
                                </span>
                                {instructions.length === 0 && name.trim() && (
                                    <button
                                        id="meal-edit-enrich-instructions-btn"
                                        type="button"
                                        onClick={handleEnrichWithAi}
                                        disabled={isAiLoading}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isAiLoading
                                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />{t('ai.enriching')}</>
                                            : <><Sparkles className="w-3.5 h-3.5" />{t('ai.enrichWithAi')}</>
                                        }
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {instructions.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('meals.noInstructions', 'Inga tillagningssteg tillagda än.')}
                                        </p>
                                    </div>
                                ) : (
                                    instructions.map((step, index) => (
                                        <div key={index} className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs mt-1">
                                                {index + 1}
                                            </span>
                                            <textarea
                                                value={step}
                                                onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                                placeholder={t('meals.stepPlaceholder', 'Beskriv steget...')}
                                                rows={2}
                                                className="flex-1 p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInstruction(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                                                title="Ta bort steg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}

                                <button
                                    type="button"
                                    onClick={handleAddInstructionStep}
                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors cursor-pointer border border-dashed border-blue-200 dark:border-blue-800"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('meals.addStep', 'Lägg till steg')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/80 -mx-5 -mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleImportJson}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                {t('meals.importFromJson', 'Importera från JSON')}
                            </button>
                            <button
                                type="button"
                                onClick={handleExportJson}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                {t('meals.exportAsJson', 'Exportera som JSON')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Avbryt')}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>{isSaving ? t('common.saving', 'Sparar...') : t('common.save', 'Spara')}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* JSON Export Modal */}
            <JsonExportModal
                isOpen={showJsonExport}
                onClose={() => setShowJsonExport(false)}
                meal={meal}
            />

            {/* JSON Import Modal */}
            <JsonImportModal
                isOpen={showJsonImport}
                onClose={() => setShowJsonImport(false)}
                onImport={handleJsonImport}
            />
        </div>
    );
};