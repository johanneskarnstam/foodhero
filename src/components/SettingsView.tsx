import React from 'react';
import {
    LogOut, SortAsc, Calendar, ChevronDown, Settings, Eye, EyeOff,
    Globe, Sliders, Database, Trash2, Edit3, X, History, User,
    Download, Copy, Check, Zap, Bug
} from 'lucide-react';
import { useWakeLock } from '../hooks/useWakeLock';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Item, HistoryItem } from '../types';
import { QuickItemsSettingsModal } from './QuickItemsSettingsModal';
import { useTranslation } from 'react-i18next';
import { parseJsonItems, convertToItems } from '../utils/importUtils';
import { Modal } from './Modal';

const SIMPLE_EXAMPLE = `[{"text": "Pajdeg", "note": "1st", "checkIfExistAtHome": true}, {"text": "Mjölk", "note": "1liter"}]`;

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = React.useState(false);

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
            <pre className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all pr-10">
                {code}
            </pre>
            <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Copy"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const SettingsView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const {
        lists,
        defaultListId,
        updateListSettings,
        updateListItems,
        theme,
        setTheme,
        itemHistory,
        updateHistoryItem,
        deleteFromHistory,
        clearAllHistory,
        quickItemsSettings,
        updateQuickItemsSettings
    } = useApp();
    const { showToast } = useToast();

    const [importAccordionOpen, setImportAccordionOpen] = React.useState(false);
    const [exportAccordionOpen, setExportAccordionOpen] = React.useState(false);
    const [exportFormat, setExportFormat] = React.useState<'simple' | 'objects' | 'wrapped'>('simple');
    const [exportScope, setExportScope] = React.useState<'active' | 'all'>('active');
    const [copiedExport, setCopiedExport] = React.useState(false);
    const [jsonText, setJsonText] = React.useState('');
    const [importError, setImportError] = React.useState('');
    const [clearAllItemsModalOpen, setClearAllItemsModalOpen] = React.useState(false);
    const [quickItemsSettingsModalOpen, setQuickItemsSettingsModalOpen] = React.useState(false);
    const list = lists.find(l => l.id === defaultListId);
    const sortBy = list?.settings?.defaultSort || 'manual';

    const { isSupported, isLocked, requestWakeLock, releaseWakeLock } = useWakeLock();

    const [calendarAccordionOpen, setCalendarAccordionOpen] = React.useState(false);
    const [historyAccordionOpen, setHistoryAccordionOpen] = React.useState(false);

    const [editingHistoryItem, setEditingHistoryItem] = React.useState<HistoryItem | null>(null);
    const [editHistoryText, setEditHistoryText] = React.useState('');

    // -----------------------------------------------------------------------
    // Calendar helpers
    // -----------------------------------------------------------------------
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    const getNextFullHour = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        return toLocalISOString(now);
    };

    const [calendarStartTime, setCalendarStartTime] = React.useState(() =>
        list?.settings?.calendarStartTime || getNextFullHour()
    );
    const [calendarEndTime, setCalendarEndTime] = React.useState(() => {
        if (list?.settings?.calendarEndTime) return list.settings.calendarEndTime;
        const startStr = list?.settings?.calendarStartTime || getNextFullHour();
        const endDate = new Date(startStr);
        endDate.setHours(endDate.getHours() + 1);
        return toLocalISOString(endDate);
    });

    const generateGoogleCalendarLink = () => {
        if (!list) return;
        const title = encodeURIComponent(t('lists.groceryTitle'));
        const itemsText = list.items.map(item => `• ${item.text}`).join('\n');
        const linkText = t('lists.settings.calendar.linkText');
        const deepLink = window.location.origin;
        const description = encodeURIComponent(`${itemsText}\n\n${linkText}: ${deepLink}`);
        const formatGoogleTime = (isoString: string) =>
            new Date(isoString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const startTime = formatGoogleTime(calendarStartTime);
        const endTime = formatGoogleTime(calendarEndTime);
        window.open(
            `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&dates=${startTime}/${endTime}`,
            '_blank'
        );
    };

    // -----------------------------------------------------------------------
    // Import
    // -----------------------------------------------------------------------
    const handleImportJson = async (content: string) => {
        if (!list) return;
        try {
            const parsedItems = parseJsonItems(content);
            const newItems = convertToItems(parsedItems);

            if (newItems.length > 0) {
                await updateListItems(list.id, [...list.items, ...newItems]);
                showToast(t('settings.importSuccess', { count: newItems.length }), 'success');
                setJsonText('');
                setImportError('');
                setImportAccordionOpen(false);
            }
        } catch (error) {
            console.error(error);
            const msg = typeof error === 'string' ? t(`importItems.${error}`) : (error instanceof Error ? error.message : t('settings.importError'));
            setImportError(msg);
        }
    };

    const handleClearAllItems = async () => {
        if (!list) return;
        await updateListItems(list.id, []);
        showToast(t('common.cleared'), 'success');
        setClearAllItemsModalOpen(false);
    };

    // -----------------------------------------------------------------------
    // Export
    // -----------------------------------------------------------------------
    const getExportJsonString = () => {
        if (!list || !list.items) return '[]';
        const itemsToExport = exportScope === 'active'
            ? list.items.filter(i => !i.completed)
            : list.items;

        const formatItem = (i: Item) => {
            const obj: { text: string; note?: string; checkIfExistAtHome?: boolean } = { text: i.text };
            if (i.note) obj.note = i.note;
            if (i.checkIfExistAtHome) obj.checkIfExistAtHome = true;
            return obj;
        };

        if (exportFormat === 'simple') {
            const arr = itemsToExport.map(i => i.text);
            return JSON.stringify(arr, null, 2);
        } else if (exportFormat === 'objects') {
            const arr = itemsToExport.map(formatItem);
            return JSON.stringify(arr, null, 2);
        } else {
            const arr = itemsToExport.map(formatItem);
            return JSON.stringify({ items: arr }, null, 2);
        }
    };

    const handleDownloadExport = () => {
        const jsonStr = getExportJsonString();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foodhero-shopping-list.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopyExport = async () => {
        const jsonStr = getExportJsonString();
        try {
            await navigator.clipboard.writeText(jsonStr);
            setCopiedExport(true);
            showToast(t('settings.copied'), 'success');
            setTimeout(() => setCopiedExport(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // -----------------------------------------------------------------------
    // History
    // -----------------------------------------------------------------------
    const handleEditHistoryItem = (item: HistoryItem) => {
        setEditingHistoryItem(item);
        setEditHistoryText(item.text);
    };

    const handleSaveHistoryItem = async () => {
        if (!editingHistoryItem || !editHistoryText.trim()) return;
        await updateHistoryItem(editingHistoryItem.id, { text: editHistoryText.trim() });
        setEditingHistoryItem(null);
        showToast(t('common.save'), 'success');
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Page header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                    <Settings size={22} />
                </div>
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('settings.subtitle')}</p>
                </div>
            </div>

            {/* CARD 1: List Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                <div className="p-6 space-y-6">

                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                            <Sliders size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('lists.settings.title')}</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('lists.settings.subtitle', 'Configure sorting and features for the shopping list')}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-700/60" />

                    {/* Sort order */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 px-1">
                            <SortAsc size={16} className="text-gray-400 dark:text-gray-500" />
                            {t('lists.settings.sort')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(['manual', 'alphabetical', 'completed'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => {
                                        if (list) {
                                            updateListSettings(list.id, {
                                                threeStageMode: list.settings?.threeStageMode ?? false,
                                                defaultSort: mode,
                                                calendarStartTime: list.settings?.calendarStartTime,
                                                calendarEndTime: list.settings?.calendarEndTime,
                                                pinned: list.settings?.pinned
                                            });
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all font-bold ${sortBy === mode
                                        ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-800'
                                    }`}
                                >
                                    <span className="text-sm">{t(`lists.sort.${mode}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Accordion */}
                    <div className="pt-2">
                        <button
                            onClick={() => setCalendarAccordionOpen(!calendarAccordionOpen)}
                            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-all border border-gray-100 dark:border-gray-700/60 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Calendar size={22} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900 dark:text-white">{t('lists.settings.calendar.title')}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('lists.settings.calendar.description')}</div>
                                </div>
                            </div>
                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${calendarAccordionOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>

                        {calendarAccordionOpen && (
                            <div className="mt-4 space-y-6 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('lists.settings.calendar.startTime')}</label>
                                        <input
                                            type="datetime-local"
                                            value={calendarStartTime}
                                            onChange={(e) => setCalendarStartTime(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('lists.settings.calendar.endTime')}</label>
                                        <input
                                            type="datetime-local"
                                            value={calendarEndTime}
                                            onChange={(e) => setCalendarEndTime(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={generateGoogleCalendarLink}
                                    className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <Calendar size={20} />
                                    {t('lists.settings.calendar.addToCalendar')}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* CARD 2: Product History */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl shadow-sm">
                            <Database size={20} />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.databases.title')}</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.databases.subtitle')}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-700/60" />

                    {/* Product History Accordion */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setHistoryAccordionOpen(!historyAccordionOpen)}
                            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-all border border-gray-100 dark:border-gray-700/60 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <History size={22} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900 dark:text-white">{t('settings.productHistoryTitle')}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.productHistoryDesc')}</div>
                                </div>
                            </div>
                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${historyAccordionOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>
                        {historyAccordionOpen && (
                            <div className="mt-4 space-y-6 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('settings.historyItems')}</div>
                                    <button
                                        onClick={async () => {
                                            if (confirm(t('common.confirmDeleteAll'))) {
                                                await clearAllHistory();
                                                showToast(t('common.cleared'), 'success');
                                            }
                                        }}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={14} />
                                        {t('common.clearAll')}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                                    {itemHistory.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium text-gray-900 dark:text-white truncate">{item.text}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {t('common.used', { count: item.usageCount })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEditHistoryItem(item)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title={t('common.edit')}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await deleteFromHistory(item.id);
                                                        showToast(t('toasts.itemDeleted'), 'info');
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {editingHistoryItem && (
                                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                                            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.edit')}</h4>
                                                    <button onClick={() => setEditingHistoryItem(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">{t('common.name')}</label>
                                                    <input
                                                        type="text"
                                                        value={editHistoryText}
                                                        onChange={(e) => setEditHistoryText(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    />
                                                </div>
                                                <div className="flex gap-3 pt-4">
                                                    <button onClick={() => setEditingHistoryItem(null)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                                                        {t('common.cancel')}
                                                    </button>
                                                    <button onClick={handleSaveHistoryItem} disabled={!editHistoryText.trim()} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50">
                                                        {t('common.save')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {itemHistory.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic">
                                            {t('settings.noHistory')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD 3: App Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl shadow-sm">
                            <Globe size={20} />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.appSettings.title')}</h2>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.appSettings.subtitle')}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-700/60" />

                    {/* Language */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 px-1">
                            <Globe size={16} className="text-gray-400 dark:text-gray-500" />
                            {t('settings.language')}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { code: 'sv', label: 'Svenska' },
                                { code: 'en', label: 'English' }
                            ].map((lang) => {
                                const isSelected = i18n.language?.startsWith(lang.code);
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => i18n.changeLanguage(lang.code)}
                                        className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center font-bold text-sm ${isSelected
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-800'
                                        }`}
                                    >
                                        {lang.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 px-1">
                                <Settings size={16} className="text-gray-400 dark:text-gray-500" />
                                {t('settings.theme')}
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['light', 'dark', 'system'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setTheme(mode)}
                                        className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center font-bold text-sm ${theme === mode
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-800'
                                        }`}
                                    >
                                        {t(`settings.themeModes.${mode}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Wake lock */}
                        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/60">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-colors ${isLocked ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                        {isLocked ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{t('settings.wakeLock')}</div>
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{t('settings.wakeLockDesc')}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => isLocked ? releaseWakeLock() : requestWakeLock()}
                                    disabled={!isSupported}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ${isLocked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span className={`${isLocked ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Items Settings */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => setQuickItemsSettingsModalOpen(true)}
                            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-all border border-gray-100 dark:border-gray-700/60 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Zap size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{t('quickItems.settings.title')}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('quickItems.settings.subtitle')}</div>
                                </div>
                            </div>
                            <ChevronDown className="text-gray-400" size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CARD 4: Data Management */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-2xl shadow-sm">
                                <Database size={20} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('settings.dataManagement')}</h2>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.dataManagementSubtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setClearAllItemsModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800/50 transition-all active:scale-95"
                        >
                            <Trash2 size={14} />
                            {t('common.clearAll')}
                        </button>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-700/60" />

                    {/* Import Accordion */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setImportAccordionOpen(!importAccordionOpen)}
                            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-all border border-gray-100 dark:border-gray-700/60 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Database size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{t('settings.importTitle')}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.importDesc')}</div>
                                </div>
                            </div>
                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${importAccordionOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>
                        {importAccordionOpen && (
                            <div className="mt-3 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 animate-in slide-in-from-top-4 duration-300 space-y-4">
                                {/* Example format directly visible */}
                                <div className="space-y-1.5 text-left">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {t('settings.jsonFormat')}
                                    </label>
                                    <CodeBlock code={SIMPLE_EXAMPLE} />
                                </div>

                                <div className="space-y-3">
                                    <div className="relative text-left">
                                        <textarea
                                            value={jsonText}
                                            onChange={(e) => { setJsonText(e.target.value); setImportError(''); }}
                                            placeholder={t('settings.jsonPlaceholder')}
                                            className={`w-full p-4 rounded-2xl border bg-white dark:bg-gray-800 focus:ring-2 outline-none text-sm font-mono min-h-[150px] transition-colors ${
                                                importError
                                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-900'
                                                    : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                                            }`}
                                        />
                                        <button
                                            onClick={() => handleImportJson(jsonText)}
                                            disabled={!jsonText.trim()}
                                            className="absolute bottom-3 right-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 text-xs"
                                        >
                                            {t('common.import')}
                                        </button>
                                    </div>

                                    {/* Error box */}
                                    {importError && (
                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 animate-in fade-in duration-150">
                                            <div className="flex-shrink-0 mt-0.5 text-red-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                            </div>
                                            <p className="text-xs font-medium text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">{importError}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Export Accordion */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setExportAccordionOpen(!exportAccordionOpen)}
                            className="flex items-center justify-between w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-all border border-gray-100 dark:border-gray-700/60 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Download size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{t('settings.exportTitle')}</div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('settings.exportDesc')}</div>
                                </div>
                            </div>
                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${exportAccordionOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>
                        {exportAccordionOpen && (
                            <div className="mt-3 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/60 animate-in slide-in-from-top-4 duration-300 space-y-4">
                                {/* Format selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.exportFormat')}</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {(['simple', 'objects', 'wrapped'] as const).map((fmt) => (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setExportFormat(fmt)}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                    exportFormat === fmt
                                                        ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-200'
                                                }`}
                                            >
                                                {t(`settings.format${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Item scope selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.exportScope')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['active', 'all'] as const).map((scp) => (
                                            <button
                                                key={scp}
                                                type="button"
                                                onClick={() => setExportScope(scp)}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                    exportScope === scp
                                                        ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-200'
                                                }`}
                                            >
                                                {t(`settings.scope${scp.charAt(0).toUpperCase() + scp.slice(1)}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="space-y-2">
                                    <div className="relative text-left">
                                        <textarea
                                            readOnly
                                            value={getExportJsonString()}
                                            className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none text-sm font-mono min-h-[140px] resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCopyExport}
                                        className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        {copiedExport ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        {t('settings.copyJson')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadExport}
                                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Download size={16} />
                                        {t('settings.downloadJson')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={clearAllItemsModalOpen}
                onClose={() => setClearAllItemsModalOpen(false)}
                onConfirm={handleClearAllItems}
                title={t('common.confirmDeleteAll')}
                message={t('settings.clearAllItemsMessage', 'Are you sure you want to clear all items from your shopping list? This action cannot be undone.')}
                confirmText={t('common.delete')}
                isDestructive={true}
            />

            {/* Account */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden text-left">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl">
                            <User size={22} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                                {user?.email || t('common.guest')}
                            </div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {t('settings.accountStatus')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        {t('common.logout')}
                    </button>
                    <button
                        onClick={() => window.location.href = '#/debug'}
                        className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/40 text-gray-600 dark:text-gray-400 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Bug size={18} />
                        {t('debug.debugPage')}
                    </button>
                </div>
            </div>

            {/* Quick Items Settings Modal */}
            <QuickItemsSettingsModal
                isOpen={quickItemsSettingsModalOpen}
                onClose={() => setQuickItemsSettingsModalOpen(false)}
                currentSettings={quickItemsSettings}
                onSave={updateQuickItemsSettings}
            />

        </div>
    );
};
