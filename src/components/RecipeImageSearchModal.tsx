import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Image, Loader2, Search, X } from 'lucide-react';
import { fetchRecipeImageWithFallback } from '../services/imageService';

interface RecipeImageSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (imageUrl: string) => void;
    recipeName: string;
}

export const RecipeImageSearchModal: React.FC<RecipeImageSearchModalProps> = ({
    isOpen,
    onClose,
    onSelectImage,
    recipeName,
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !recipeName) return;
        setSearchQuery(recipeName);
        void searchForImage(recipeName);
    }, [isOpen, recipeName]);

    const searchForImage = async (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setImageUrl(null);
            setError(null);
            return;
        }

        setIsSearching(true);
        setError(null);
        try {
            const url = await fetchRecipeImageWithFallback(trimmedQuery);
            setImageUrl(url);
            if (!url) setError(t('meals.noImageFound', 'Ingen bild hittades'));
        } catch (searchError) {
            setImageUrl(null);
            setError(searchError instanceof Error
                ? searchError.message
                : t('meals.noImageFound', 'Ingen bild hittades'));
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void searchForImage(searchQuery);
    };

    const handleSelectImage = () => {
        if (!imageUrl) return;
        onSelectImage(imageUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-image-search-title"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 id="recipe-image-search-title" className="text-lg font-bold text-gray-900 dark:text-white">
                            {t('ai.changeImage', 'Byt bild')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close', 'Stäng')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="image-search-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('ai.recipePromptLabel', 'Beskriv din måltid')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="image-search-query"
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                disabled={isSearching}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition"
                            />
                            <button
                                type="submit"
                                disabled={!searchQuery.trim() || isSearching}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shrink-0"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {t('common.search', 'Sök')}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div role="alert" className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <X className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {imageUrl && (
                        <div className="space-y-2">
                            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
                                <img src={imageUrl} alt={searchQuery} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {t('meals.previewRecipe', 'Förhandsvisning')}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {t('common.cancel', 'Avbryt')}
                    </button>
                    <button type="button" onClick={handleSelectImage} disabled={!imageUrl} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {t('common.select', 'Välj')}
                    </button>
                </div>
            </div>
        </div>
    );
};
