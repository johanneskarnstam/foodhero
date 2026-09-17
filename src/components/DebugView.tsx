import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bug, Smartphone, Monitor, Globe, Cpu, Chrome, Save, Trash2, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedDebugInfo } from '../hooks/useSavedDebugInfo';
import { SavedDebugInfo } from '../types';

export const DebugView: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { savedDebugInfos, loading: loadingSavedInfos, saveDebugInfo, deleteSavedDebugInfo } = useSavedDebugInfo(user?.uid);
    
    const [info, setInfo] = useState<{
        screenWidth: number; screenHeight: number;
        windowWidth: number; windowHeight: number;
        devicePixelRatio: number;
        userAgent: string; platform: string;
        isMobile: boolean; isTablet: boolean;
        browserName: string; browserVersion: string;
        osName: string; osVersion: string;
        modelName: string; manufacturer: string;
        timeZone: string; language: string;
        cpuCores: number | null;
        touchSupport: boolean;
        isOnline: boolean;
    } | null>(null);
    
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /(iPad|Tablet|PlayBook|Xoom|Tab)/i.test(userAgent) || (isMobile && window.innerWidth > 768);
        
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] ?? 'Unknown';
        } else if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] ?? 'Unknown';
        } else if (userAgent.includes('Safari')) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] ?? 'Unknown';
        } else if (userAgent.includes('Edge')) {
            browserName = 'Edge';
            browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] ?? 'Unknown';
        }
        
        let osName = 'Unknown';
        let osVersion = 'Unknown';
        if (/Windows/i.test(userAgent)) {
            osName = 'Windows';
            osVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] ?? 'Unknown';
        } else if (/Mac OS X/i.test(userAgent)) {
            osName = 'macOS';
            osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') ?? 'Unknown';
        } else if (/Android/i.test(userAgent)) {
            osName = 'Android';
            osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] ?? 'Unknown';
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            osName = 'iOS';
            osVersion = userAgent.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') ?? 'Unknown';
        }
        
        let modelName = 'Unknown';
        let manufacturer = 'Unknown';
        if (/iPhone/i.test(userAgent)) {
            manufacturer = 'Apple';
            modelName = 'iPhone';
        } else if (/iPad/i.test(userAgent)) {
            manufacturer = 'Apple';
            modelName = 'iPad';
        } else if (/Android/i.test(userAgent)) {
            manufacturer = userAgent.match(/; (\w+);/)?.[1] ?? 'Unknown';
            modelName = userAgent.match(/; (\w+ \w+);/)?.[1] ?? userAgent.match(/; (\w+);/)?.[1] ?? 'Unknown';
        }
        
        const cpuCores = navigator.hardwareConcurrency ?? null;
        const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        setInfo({
            screenWidth: screen.width, screenHeight: screen.height,
            windowWidth: window.innerWidth, windowHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            userAgent, platform: navigator.platform,
            isMobile, isTablet,
            browserName, browserVersion,
            osName, osVersion,
            modelName, manufacturer,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            cpuCores, touchSupport,
            isOnline: navigator.onLine
        });

        const handleResize = () => setInfo(prev => prev ? {
            ...prev,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        } : null);
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSaveDebugInfo = async () => {
        if (!info || !user) return;
        
        try {
            await saveDebugInfo(user.uid, saveTitle, info);
            setShowSaveModal(false);
            setSaveTitle('');
        } catch (error) {
            console.error('Failed to save debug info:', error);
        }
    };

    const handleDeleteDebugInfo = async (id: string) => {
        try {
            await deleteSavedDebugInfo(id);
            setShowDeleteModal(null);
        } catch (error) {
            console.error('Failed to delete debug info:', error);
        }
    };

    const openSaveModal = () => {
        setShowSaveModal(true);
    };

    const closeSaveModal = () => {
        setShowSaveModal(false);
        setSaveTitle('');
    };

    const openDeleteModal = (id: string) => {
        setShowDeleteModal(id);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(null);
    };

    if (!info) return (
        <div className="max-w-4xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl">
                    <Bug size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('debug.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('debug.loading')}</p>
                </div>
            </div>
        </div>
    );

    const Card = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">{icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );

    const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
    );

    const SavedDebugInfoCard = ({ debugInfo }: { debugInfo: SavedDebugInfo }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                        <Save size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{debugInfo.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            <Clock size={12} className="inline mr-1" />
                            {new Date(debugInfo.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => openDeleteModal(debugInfo.id)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={t('debug.deleteTitle')}
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="p-4">
                <Row label={t('debug.deviceType')} value={
                    debugInfo.deviceInfo.isMobile ? t('debug.mobile') : 
                    debugInfo.deviceInfo.isTablet ? t('debug.tablet') : t('debug.desktop')
                } />
                <Row label={t('debug.manufacturer')} value={debugInfo.deviceInfo.manufacturer} />
                <Row label={t('debug.modelName')} value={debugInfo.deviceInfo.modelName} />
                <Row label={t('debug.osName')} value={debugInfo.deviceInfo.osName} />
                <Row label={t('debug.browserName')} value={debugInfo.deviceInfo.browserName} />
                <Row label={t('debug.screenResolution')} value={`${debugInfo.deviceInfo.screenWidth} × ${debugInfo.deviceInfo.screenHeight}`} />
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('debug.saveTitle')}</h3>
                            <button
                                onClick={closeSaveModal}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            placeholder={t('debug.saveTitlePlaceholder')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeSaveModal}
                                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                {t('debug.cancelButton')}
                            </button>
                            <button
                                onClick={handleSaveDebugInfo}
                                disabled={!saveTitle.trim()}
                                className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('debug.saveButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('debug.deleteTitle')}</h3>
                            <button
                                onClick={closeDeleteModal}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('debug.deleteMessage')}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => handleDeleteDebugInfo(showDeleteModal)}
                                className="flex-1 py-3 px-4 bg-red-600 dark:bg-red-500 text-white rounded-xl font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-all"
                            >
                                {t('debug.deleteConfirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl">
                    <Bug size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('debug.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('debug.subtitle')}</p>
                </div>
                {user && (
                    <button
                        onClick={openSaveModal}
                        className="ml-auto py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">{t('debug.saveDebugInfo')}</span>
                    </button>
                )}
            </div>

            {user && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('debug.savedDebugInfos')}</h3>
                    {loadingSavedInfos ? (
                        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                    ) : savedDebugInfos.length > 0 ? (
                        <div className="space-y-4">
                            {savedDebugInfos.map((debugInfo) => (
                                <SavedDebugInfoCard key={debugInfo.id} debugInfo={debugInfo} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">{t('debug.noSavedInfos')}</p>
                    )}
                </div>
            )}

            <Card title={t('debug.deviceType')} icon={<Smartphone size={20} />}>
                <Row label={t('debug.deviceType')} value={info.isMobile ? t('debug.mobile') : info.isTablet ? t('debug.tablet') : t('debug.desktop')} />
                <Row label={t('debug.manufacturer')} value={info.manufacturer} />
                <Row label={t('debug.modelName')} value={info.modelName} />
                <Row label={t('debug.platform')} value={info.platform} />
            </Card>

            <Card title={t('debug.screenInfo')} icon={<Monitor size={20} />}>
                <Row label={t('debug.screenResolution')} value={`${info.screenWidth} × ${info.screenHeight}`} />
                <Row label={t('debug.windowSize')} value={`${info.windowWidth} × ${info.windowHeight}`} />
                <Row label={t('debug.pixelRatio')} value={info.devicePixelRatio} />
                <Row label={t('debug.aspectRatio')} value={`${(info.screenWidth / info.screenHeight).toFixed(2)} (${info.screenWidth}:${info.screenHeight})`} />
            </Card>

            <Card title={t('debug.browserInfo')} icon={<Chrome size={20} />}>
                <Row label={t('debug.browserName')} value={info.browserName} />
                <Row label={t('debug.browserVersion')} value={info.browserVersion} />
            </Card>

            <Card title={t('debug.osInfo')} icon={<Globe size={20} />}>
                <Row label={t('debug.osName')} value={info.osName} />
                <Row label={t('debug.osVersion')} value={info.osVersion} />
                <Row label={t('debug.timeZone')} value={info.timeZone} />
                <Row label={t('debug.language')} value={info.language} />
            </Card>

            <Card title={t('debug.hardwareInfo')} icon={<Cpu size={20} />}>
                <Row label={t('debug.cpuCores')} value={info.cpuCores ?? t('debug.notAvailable')} />
                <Row label={t('debug.touchSupport')} value={info.touchSupport ? t('debug.yes') : t('debug.no')} />
                <Row label={t('debug.isOnline')} value={info.isOnline ? t('debug.yes') : t('debug.no')} />
            </Card>
        </div>
    );
};
