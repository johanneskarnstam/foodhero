import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutGrid,
    ShoppingCart,
    SquareCheck,
    Utensils,
    UtensilsCrossed,
    Settings,
    Activity,
    BarChart3,
    History,
    RefreshCw
} from 'lucide-react';
import { Commit } from '../types';
import commitsData from '../commits.json';

const commits = commitsData as Commit[];

interface SidebarProps {
    onNavClick?: () => void;
}

// eslint-disable-next-line react/prop-types
export const Sidebar: React.FC<SidebarProps> = ({ onNavClick }) => {
    const { t } = useTranslation();
    const latestCommit = commits[0];

    const navItems = [
        { path: '/', icon: LayoutGrid, label: t('nav.home') },
        { path: '/shopping', icon: ShoppingCart, label: t('nav.shopping', 'Inköp') },
        { path: '/todos', icon: SquareCheck, label: t('nav.todos') },
        { path: '/meals', icon: Utensils, label: t('nav.meals', 'Måltider') },
        { path: '/mealplan', icon: UtensilsCrossed, label: t('nav.mealplan', 'Måltidsplan') },
        { path: '/activity', icon: Activity, label: t('history.title', 'Activity') },
        { path: '/statistics', icon: BarChart3, label: t('history.statistics', 'Statistics') },
        { path: '/history', icon: History, label: t('history.suggestionHistory', 'History') },
        { path: '/settings', icon: Settings, label: t('nav.settings') },
    ];

    const handleReload = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) { registration.unregister(); }
                window.location.reload();
            });
        } else { window.location.reload(); }
    };

    return (
        <div className="flex min-h-screen h-full flex-col glass border-r-0">
            {/* Logo Area */}
            <div className="p-6 hidden md:block">
                <Link to="/" onClick={onNavClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="FoodHero logo" className="w-20 h-20 rounded-2xl shadow-sm" />
                    <h1 className="text-3xl font-bold text-[#2c6de3]">
                        {t('app.title', 'FoodHero')}
                    </h1>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onNavClick}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                            ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }
                        `}
                    >
                        <item.icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={handleReload}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                >
                    <RefreshCw size={20} className="group-hover:scale-110 transition-transform duration-200" />
                    <span>{t('settings.reloadUpdate', 'Reload & Update')}</span>
                </button>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">


                {/* Commit Info */}
                {latestCommit && (
                    <div className="px-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400 dark:text-gray-500">
                                <span className="uppercase">
                                    {(() => {
                                        const commitDate = new Date(latestCommit.date);
                                        const now = new Date();
                                        const isCurrentYear = commitDate.getFullYear() === now.getFullYear();
                                        const day = commitDate.getDate().toString().padStart(2, '0');
                                        const month = commitDate.toLocaleString('sv-SE', { month: 'short' });
                                        const year = isCurrentYear ? '' : ` ${commitDate.getFullYear()}`;
                                        return `${day} ${month}${year}`;
                                    })()}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <Link
                                    to="/activity"
                                    onClick={onNavClick}
                                    className="transition-colors hover:text-blue-500 dark:hover:text-blue-400 truncate"
                                    title={latestCommit.message}
                                >
                                    {latestCommit.message.length > 20
                                        ? `${latestCommit.message.substring(0, 20)}...`
                                        : latestCommit.message}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
