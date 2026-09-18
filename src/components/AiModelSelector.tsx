import React from 'react';
import { Sparkles, RefreshCw, Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAiModelSetting } from '../hooks/useAiModelSetting';
import { useToast } from '../context/ToastContext';
import { AIModelOption } from '../types';

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

            {/* Modellista */}
            <div className="space-y-2.5" role="radiogroup" aria-label={t('aiSettings.title')}>
                {models.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                        <button
                            key={model.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelectModel(model)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                    ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 dark:border-amber-500/40'
                                    : 'bg-gray-50/50 hover:bg-gray-100/70 dark:bg-gray-700/20 dark:hover:bg-gray-700/40 border-gray-100 dark:border-gray-700/50'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold truncate ${
                                        isSelected
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {model.name}
                                    </span>
                                    {model.id === selectedModelId && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                            {t('aiSettings.activeModel')}
                                        </span>
                                    )}
                                </div>
                                {model.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        {model.description}
                                    </p>
                                )}
                            </div>

                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 ${
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
        </div>
    );
};
