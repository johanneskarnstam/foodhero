import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Meal } from '../types';
import { Copy, Check, X } from 'lucide-react';

interface JsonExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: Meal | null;
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
    isOpen,
    onClose,
    meal
}) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    if (!isOpen || !meal) return null;

    // Skapa en ren version av meal utan id och createdAt för export
    // Säkerställ att alla fält finns, även om de är tomma, för kompatibilitet med externa verktyg
    const exportData = {
        name: meal.name || "",
        description: meal.description || "",
        imageUrl: meal.imageUrl || "",
        servings: meal.servings || 0,
        tags: meal.tags || [],
        ingredients: (meal.ingredients || []).map(ingredient => ({
            text: ingredient.text || "",
            amount: ingredient.amount || "",
            checkIfExistAtHome: ingredient.checkIfExistAtHome || false
        })),
        instructions: meal.instructions || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback för äldre webbläsare
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl md:max-w-[calc(100vw-2rem)] lg:max-w-2xl w-full max-h-[80vh] p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('meals.jsonExportTitle', 'Exportera recept som JSON')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('meals.jsonExportDescription', 'Kopiera denna JSON för att spara eller dela ditt recept.')}
                </p>

                <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-[50vh] overflow-auto">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                        {jsonString}
                    </pre>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('common.close', 'Stäng')}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check size={16} />
                                {t('meals.jsonCopied', 'Kopierad!')}
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                {t('common.copy', 'Kopiera')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};