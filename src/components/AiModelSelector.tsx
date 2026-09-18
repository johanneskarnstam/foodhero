import React, { useState } from 'react';
import { Sparkles, RefreshCw, Check, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAiModelSetting } from '../hooks/useAiModelSetting';
import { useToast } from '../context/ToastContext';
import { AIModelOption } from '../types';

const INITIAL_LIMIT = 5;

function getBadgeStyle(badge?: string): string {
    switch (badge) {
        case 'Toppval':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
        case 'Resonemang':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
        case 'Snabb & modern':
        case 'Snabb':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
        case 'Stabil':
        case 'Auto-uppdaterad':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
        case 'Lättvikt':
            return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300 border-gray-200 dark:border-gray-600/40';
    }
}

export const AiModelSelector: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const {
        selectedModelId,
        setSelectedModelId,
        models,
        isLoading,
        isFetchingRemote,
        refreshModels,
    } = useAiModelSetting();

    const [showAll, setShowAll] = useState(false);

    const handleSelectModel = (model: AIModelOption) => {
        if (model.id === selectedModelId) return;
        setSelectedModelId(model.id);
        showToast(
            t('aiSettings.modelChanged', { name: model.name }),
            'success'
        );
    };

    const handleRefresh = async () => {
        try {
            await refreshModels();
            showToast(
                t('aiSettings.refreshSuccess', { count: models.length }),
                'success'
            );
        } catch {
            showToast(t('aiSettings.refreshError'), 'error');
        }
    };

    const isOnlineList = models.some(m => m.isOnline);

    // Säkerställ att vald modell alltid syns även om listan inte är expanderad
    const visibleModels = React.useMemo(() => {
        if (showAll || models.length <= INITIAL_LIMIT) {
            return models;
        }
        const topSlice = models.slice(0, INITIAL_LIMIT);
        const selectedModel = models.find(m => m.id === selectedModelId);
        if (selectedModel && !topSlice.some(m => m.id === selectedModelId)) {
            return [...topSlice, selectedModel];
        }
        return topSlice;
    }, [models, showAll, selectedModelId]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/60 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {t('aiSettings.title')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('aiSettings.description')}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={isFetchingRemote || isLoading}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors disabled:opacity-50"
                    title={t('aiSettings.refreshButton')}
                    aria-label={t('aiSettings.refreshButton')}
                >
                    <RefreshCw
                        size={18}
                        className={isFetchingRemote ? 'animate-spin text-amber-500' : ''}
                    />
                </button>
            </div>

            {/* Status-etikett */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                <Globe size={13} className={isOnlineList ? 'text-emerald-500' : 'text-gray-400'} />
                <span>
                    {isOnlineList
                        ? t('aiSettings.cachedNotice')
                        : t('aiSettings.fallbackNotice')}
                </span>
            </div>

            {/* Modellista rangordnad bäst längst upp */}
            <div className="space-y-2.5" role="radiogroup" aria-label={t('aiSettings.title')}>
                {visibleModels.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                        <button
                            key={model.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelectModel(model)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                isSelected
                                    ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 dark:border-amber-500/40'
                                    : 'bg-gray-50/50 hover:bg-gray-100/70 dark:bg-gray-700/20 dark:hover:bg-gray-700/40 border-gray-100 dark:border-gray-700/50'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-sm font-semibold ${
                                        isSelected
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {model.name}
                                    </span>

                                    {/* Specialitets-badge */}
                                    {model.badge && (
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(model.badge)}`}>
                                            {model.badge}
                                        </span>
                                    )}

                                    {/* Aktiv-indikator */}
                                    {isSelected && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                            {t('aiSettings.activeModel')}
                                        </span>
                                    )}
                                </div>

                                {/* Teknisk modell-identifierare */}
                                <span className="inline-block text-[11px] font-mono text-gray-400 dark:text-gray-400 mt-0.5">
                                    {model.id}
                                </span>

                                {/* Koncis beskrivning av modellens styrkor */}
                                {model.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                        {model.description}
                                    </p>
                                )}
                            </div>

                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 mt-0.5 ${
                                isSelected
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Visa fler / visa färre knappar vid många modeller */}
            {models.length > INITIAL_LIMIT && (
                <button
                    type="button"
                    onClick={() => setShowAll(prev => !prev)}
                    className="w-full mt-3 py-2 px-4 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/30 dark:hover:bg-gray-700/60 border border-gray-200/70 dark:border-gray-700/50 flex items-center justify-center gap-1.5 transition-colors"
                >
                    {showAll ? (
                        <>
                            <span>{t('aiSettings.showLess')}</span>
                            <ChevronUp size={14} />
                        </>
                    ) : (
                        <>
                            <span>{t('aiSettings.showMore', { count: models.length })}</span>
                            <ChevronDown size={14} />
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
