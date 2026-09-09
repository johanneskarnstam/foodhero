import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, CalendarDays, ChefHat, MoreHorizontal, X, SquareCheck, Settings, Activity, BarChart3, History, Search, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface BottomNavProps {
    onMoreOpen?: () => void;
    onNavigate?: () => void;
    style?: React.CSSProperties;
}

interface MoreDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

// Haptic feedback utility for mobile devices
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const durations = {
            light: 20,
            medium: 40,
            heavy: 60,
        };
        navigator.vibrate(durations[type]);
    }
};

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isOpen) {
            triggerHapticFeedback('light');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const secondaryItems = [
        {
            path: '/todos',
            icon: SquareCheck,
            label: t('nav.todos', 'Att göra'),
            group: t('nav.productivity', 'Produktivitet'),
        },
        {
            path: '/ingredients',
            icon: Search,
            label: t('ingredientSearch.title', 'Sök ingrediens'),
            group: t('nav.tools', 'Verktyg'),
        },
        {
            path: '/activity',
            icon: Activity,
            label: t('history.title', 'Aktivitet'),
            group: t('nav.productivity', 'Produktivitet'),
        },
        {
            path: '/statistics',
            icon: BarChart3,
            label: t('history.statistics', 'Statistik'),
            group: t('nav.productivity', 'Produktivitet'),
        },
        {
            path: '/history',
            icon: History,
            label: t('history.suggestionHistory', 'Historik'),
            group: t('nav.tools', 'Verktyg'),
        },
        {
            path: '/settings',
            icon: Settings,
            label: t('nav.settings', 'Inställningar'),
            group: t('nav.settingsGroup', 'Inställningar'),
        },
    ];

    const groupedItems = secondaryItems.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = [];
        }
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof secondaryItems>);

    const handleItemClick = (path: string) => {
        triggerHapticFeedback('light');
        navigate(path);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                data-testid="drawer-backdrop"
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                onClick={() => {
                    triggerHapticFeedback('light');
                    onClose();
                }}
            />
            {/* Drawer */}
            <div className="fixed bottom-14 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom-4 duration-250">
                <div className="mx-3 mb-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('nav.more', 'Mer')}</span>
                        <button
                            onClick={() => {
                                triggerHapticFeedback('light');
                                onClose();
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                            aria-label={t('common.close', 'Stäng')}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-2">
                        {Object.entries(groupedItems).map(([groupName, items]) => (
                            <div key={groupName} className="mb-2">
                                <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{groupName}</p>
                                {items.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => handleItemClick(item.path)}
                                        className={clsx(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                                            location.pathname === item.path
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                                        )}
                                    >
                                        <item.icon
                                            size={19}
                                            className={clsx(
                                                'flex-shrink-0 transition-transform duration-200',
                                                location.pathname === item.path
                                                    ? 'text-blue-500 dark:text-blue-400 scale-110'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            )}
                                        />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export const BottomNav: React.FC<BottomNavProps> = ({ onMoreOpen, onNavigate, style }) => {
    const { t } = useTranslation();
    const location = useLocation();

    const primaryTabs = [
        {
            path: '/',
            icon: LayoutGrid,
            label: t('nav.home', 'Hem'),
            exact: true,
            testId: 'nav-home',
        },
        {
            path: '/shopping',
            icon: ShoppingCart,
            label: t('nav.shopping', 'Inköp'),
            exact: false,
            testId: 'nav-shopping',
        },
        {
            path: '/mealplan',
            icon: CalendarDays,
            label: t('nav.mealplan', 'Matsedel'),
            exact: false,
            testId: 'nav-mealplan',
        },
        {
            path: '/meals',
            icon: ChefHat,
            label: t('nav.meals', 'Recept'),
            exact: false,
            testId: 'nav-meals',
        },
    ];

    const handleNavClick = () => {
        triggerHapticFeedback('light');
        if (onNavigate) onNavigate();
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', ...style }}
            aria-label={t('nav.mainNavigation', 'Huvudnavigation')}
        >
            <div className="bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-stretch h-14">
                    {primaryTabs.map((tab) => {
                        const isActive = location.pathname === tab.path ||
                            (!tab.exact && location.pathname.startsWith(tab.path));

                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                end={tab.exact}
                                onClick={handleNavClick}
                                data-testid={tab.testId}
                                className={clsx(
                                    'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative',
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                )}
                            >
                                {() => (
                                    <>
                                        <tab.icon
                                            size={22}
                                            className={clsx(
                                                'transition-all duration-200',
                                                isActive ? 'scale-110' : 'scale-100'
                                            )}
                                            strokeWidth={isActive ? 2.2 : 1.8}
                                        />
                                        <span className={clsx(
                                            'text-[10px] font-medium leading-none transition-all duration-200',
                                            isActive ? 'font-semibold' : ''
                                        )}>
                                            {tab.label}
                                        </span>
                                        {isActive && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* More button */}
                    <button
                        onClick={() => {
                            triggerHapticFeedback('light');
                            if (onMoreOpen) onMoreOpen();
                        }}
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        data-testid="nav-more"
                        aria-label={t('nav.more', 'Mer')}
                    >
                        <MoreHorizontal
                            size={22}
                            strokeWidth={1.8}
                            className="transition-transform duration-200"
                        />
                        <span className="text-[10px] font-medium leading-none">{t('nav.more', 'Mer')}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
