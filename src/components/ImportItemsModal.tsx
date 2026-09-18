import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Braces, ChevronDown, Copy, Check, X, FileText } from 'lucide-react';
import { parseRecipeText } from '../utils/recipeParser';
import { parseJsonItems, ParsedImportItem } from '../utils/importUtils';

interface ImportItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with validated item texts or objects to add to the list */
    onImport: (items: (string | ParsedImportItem)[]) => Promise<void>;
    /** Existing item texts (lowercased) to detect duplicates */
    existingItemTexts: string[];
}

const SIMPLE_EXAMPLE = `["Milk", "Eggs", "Bread", "Butter"]`;
const OBJECT_EXAMPLE = `[{"text": "Pajdeg", "note": "1st", "checkIfExistAtHome": true}, {"text": "Mjölk", "note": "1liter"}]`;
const WRAPPED_EXAMPLE = `{"items": [{"text": "Pajdeg", "note": "1st", "checkIfExistAtHome": true}, {"text": "Mjölk", "note": "1liter"}]}`;


const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <div className="relative group">
            <pre className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all pr-10">
                {code}
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('common.copy')}
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
    );
};

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({
    isOpen,
    onClose,
    onImport,
    existingItemTexts,
}) => {
    const { t } = useTranslation();
    const [importMode, setImportMode] = useState<'json' | 'recipe'>('json');
    const [jsonText, setJsonText] = useState('');
    const [recipeText, setRecipeText] = useState('');
    const [previewItems, setPreviewItems] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const [showExample, setShowExample] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (importMode === 'recipe') {
            const parsed = parseRecipeText(recipeText);
            setPreviewItems(parsed);
            setSelectedItems(new Set(parsed));
        }
    }, [recipeText, importMode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setJsonText(text);
            setError('');
        };
        reader.readAsText(file);
        // Reset so the same file can be re-selected
        e.target.value = '';
    };

    const handleImport = async () => {
        let itemsToImport: (string | ParsedImportItem)[];

        if (importMode === 'json') {
            const raw = jsonText.trim();
            if (!raw) {
                setError(t('importItems.errorEmpty'));
                return;
            }
            try {
                itemsToImport = parseJsonItems(raw);
            } catch (errKey) {
                setError(t(`importItems.${errKey as string}`));
                return;
            }
        } else {
            if (selectedItems.size === 0) {
                setError(t('importRecipe.errorEmpty'));
                return;
            }
            itemsToImport = Array.from(selectedItems);
        }

        // Separate new items from duplicates
        const existingSet = new Set(existingItemTexts.map((s) => s.toLowerCase()));
        const newItems = itemsToImport.filter((item) => {
            const text = typeof item === 'string' ? item : item.text;
            return !existingSet.has(text.toLowerCase());
        });

        setError('');
        setIsImporting(true);
        try {
            await onImport(newItems);
            // Reset state on success
            setJsonText('');
            setRecipeText('');
            setPreviewItems([]);
            setSelectedItems(new Set());
            setShowExample(false);
            onClose();
        } catch {
            setError(importMode === 'json' ? t('importItems.errorFailed') : t('importRecipe.errorFailed') || t('common.error'));
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setJsonText('');
        setRecipeText('');
        setPreviewItems([]);
        setSelectedItems(new Set());
        setError('');
        setShowExample(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-[calc(100vw-2rem)] 2xl:max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            {importMode === 'json' ? <Braces size={18} className="text-blue-600 dark:text-blue-400" /> : <FileText size={18} className="text-blue-600 dark:text-blue-400" />}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {importMode === 'json' ? t('importItems.title') : t('importRecipe.title')}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit">
                        <button
                            onClick={() => setImportMode('json')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                importMode === 'json'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('importRecipe.toggleJson')}
                        </button>
                        <button
                            onClick={() => setImportMode('recipe')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                importMode === 'recipe'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {t('importRecipe.toggleRecipe')}
                        </button>
                    </div>

                    {importMode === 'json' ? (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('importItems.description')}
                            </p>

                            {/* Example formats accordion */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => setShowExample(!showExample)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {showExample ? t('importItems.hideExample') : t('importItems.showExample')}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`text-gray-400 transition-transform duration-200 ${showExample ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {showExample && (
                                    <div className="px-4 pb-4 pt-3 space-y-3 bg-white dark:bg-gray-800 animate-in slide-in-from-top-1 duration-150">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {t('importItems.exampleLabel')}
                                        </p>

                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                {t('importItems.simpleFormat')}
                                            </p>
                                            <CodeBlock code={SIMPLE_EXAMPLE} />
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                {t('importItems.objectFormat')}
                                            </p>
                                            <CodeBlock code={OBJECT_EXAMPLE} />
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                {t('importItems.wrappedFormat')}
                                            </p>
                                            <CodeBlock code={WRAPPED_EXAMPLE} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={jsonText}
                                onChange={(e) => { setJsonText(e.target.value); setError(''); }}
                                placeholder={t('importItems.placeholder')}
                                rows={6}
                                className={`w-full p-3 rounded-xl border text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 outline-none resize-none transition-colors ${
                                    error
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                                }`}
                            />

                            {/* File upload */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                <span className="text-xs text-gray-400">{t('importItems.orUpload')}</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-sm font-medium"
                            >
                                <Braces size={16} />
                                {t('importItems.selectFile')}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('importRecipe.description')}
                            </p>
                            <textarea
                                value={recipeText}
                                onChange={(e) => { setRecipeText(e.target.value); setError(''); }}
                                placeholder={t('importRecipe.placeholder')}
                                rows={6}
                                className={`w-full p-3 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 outline-none resize-none transition-colors ${
                                    error
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                                }`}
                            />
                            {previewItems.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {t('importRecipe.previewTitle')}
                                        </h3>
                                        <span className="text-[10px] text-gray-400">{selectedItems.size}/{previewItems.length} selected</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                                        {t('importRecipe.previewDesc')}
                                    </p>
                                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto p-1">
                                        {previewItems.map((item, idx) => (
                                            <label
                                                key={`${item}-${idx}`}
                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(item)}
                                                    onChange={() => {
                                                        const next = new Set(selectedItems);
                                                        if (next.has(item)) next.delete(item);
                                                        else next.add(item);
                                                        setSelectedItems(next);
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="truncate">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in duration-150">
                            <X size={14} className="flex-shrink-0" />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={isImporting || (importMode === 'json' ? !jsonText.trim() : selectedItems.size === 0)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {importMode === 'json' ? <Braces size={15} /> : <Check size={15} />}
                        {isImporting ? t('importItems.importing') : (importMode === 'json' ? t('importItems.import') : t('importRecipe.import'))}
                    </button>
                </div>
            </div>
        </div>
    );
};
