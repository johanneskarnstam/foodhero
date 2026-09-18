import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Meal } from '../types';
import { X, ClipboardPaste, AlertCircle } from 'lucide-react';

interface JsonImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: Partial<Meal>) => void;
}

interface ImportableMeal {
    name?: string;
    description?: string;
    imageUrl?: string;
    servings?: number;
    tags?: string[];
    ingredients?: {
        text: string;
        amount?: string;
        checkIfExistAtHome?: boolean;
    }[];
    instructions?: string[];
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
    isOpen,
    onClose,
    onImport
}) => {
    const { t } = useTranslation();
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setJsonInput(text);
        } catch {
            const textArea = document.createElement('textarea');
            document.body.appendChild(textArea);
            textArea.focus();
            const success = document.execCommand('paste');
            document.body.removeChild(textArea);
            
            if (success) {
                const pastedText = prompt(t('meals.pasteJsonPrompt', 'Klistra in din JSON här:'));
                if (pastedText) {
                    setJsonInput(pastedText);
                }
            }
        }
    };

    const handleImport = () => {
        try {
            if (!jsonInput.trim()) {
                setError(t('meals.jsonImportEmpty', 'Vänligen klistra in JSON-data.'));
                return;
            }

            const parsed = JSON.parse(jsonInput) as ImportableMeal;
            
            if (!parsed || typeof parsed !== 'object') {
                setError(t('meals.jsonImportError', 'Ogiltig JSON eller felaktigt format.'));
                return;
            }

            if (!parsed.name) {
                setError(t('meals.jsonImportNoName', 'JSON måste innehålla ett "name" fält.'));
                return;
            }

            const importData: Partial<Meal> = {
                name: parsed.name,
                description: parsed.description,
                imageUrl: parsed.imageUrl,
                servings: parsed.servings,
                tags: parsed.tags,
                ingredients: parsed.ingredients,
                instructions: parsed.instructions
            };

            onImport(importData);
            setJsonInput('');
            setError(null);
            onClose();
            
        } catch {
            setError(t('meals.jsonImportError', 'Ogiltig JSON eller felaktigt format.'));
        }
    };

    const handleClear = () => {
        setJsonInput('');
        setError(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl md:max-w-[calc(100vw-2rem)] 2xl:max-w-2xl w-full p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('meals.jsonImportTitle', 'Importera recept från JSON')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('meals.jsonImportDescription', 'Klistra in JSON-data för att importera ett recept. Befintlig data kommer att ersättas.')}
                </p>

                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="relative mb-4">
                    <textarea
                        value={jsonInput}
                        onChange={(e) => {
                            setJsonInput(e.target.value);
                            setError(null);
                        }}
                        placeholder={t('meals.jsonImportPlaceholder', 'Klistra in JSON här...')}
                        className="w-full h-64 p-4 pr-12 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                    />
                    <button
                        onClick={handlePaste}
                        className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={t('meals.pasteFromClipboard', 'Klistra in från urklipp')}
                    >
                        <ClipboardPaste size={18} />
                    </button>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('common.clear', 'Rensa')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('common.cancel', 'Avbryt')}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!jsonInput.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.import', 'Importera')}
                    </button>
                </div>
            </div>
        </div>
    );
};