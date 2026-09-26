import React from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, Play, Pause, RotateCcw, X, CheckCircle2, VolumeX } from 'lucide-react';
import { RecipeTimer } from '../hooks/useRecipeTimers';
import { formatRemainingTime } from '../utils/timerUtils';

interface RecipeTimerBarProps {
    timers: RecipeTimer[];
    onToggle: (id: string) => void;
    onReset: (id: string) => void;
    onAdjust: (id: string, deltaSeconds: number) => void;
    onRemove: (id: string) => void;
    isAlarmPlaying: boolean;
    onStopAlarm: () => void;
}

export const RecipeTimerBar: React.FC<RecipeTimerBarProps> = ({
    timers,
    onToggle,
    onReset,
    onAdjust,
    onRemove,
    isAlarmPlaying,
    onStopAlarm
}) => {
    const { t } = useTranslation();

    if (!timers || timers.length === 0) return null;

    return (
        <div 
            className="border-t border-gray-200 dark:border-gray-700/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-2.5 sm:p-3 shadow-lg z-20 transition-all animate-in slide-in-from-bottom-2 duration-200"
            data-testid="recipe-timer-bar"
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        {t('timers.activeTimers', 'Aktiva timers')} ({timers.length})
                    </span>
                </div>
                {isAlarmPlaying && (
                    <button
                        type="button"
                        onClick={onStopAlarm}
                        aria-label={t('timers.stopAlert', 'Stoppa ljudet')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                        <VolumeX size={15} />
                        <span>{t('timers.stopAlert', 'Stoppa ljudet')}</span>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {timers.map((timer) => {
                    const isFinished = timer.isFinished;
                    const isRunning = timer.isRunning;

                    return (
                        <div
                            key={timer.id}
                            className={`flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
                                isFinished
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-sm animate-pulse'
                                    : isRunning
                                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50'
                                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700/60 opacity-90'
                            }`}
                            data-testid={`recipe-timer-${timer.id}`}
                        >
                            {/* Left: Info */}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                    {t('timers.step', { step: timer.stepNumber })}
                                </span>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">
                                    {timer.label}
                                </span>
                            </div>

                            {/* Center: Countdown display */}
                            <div className="flex items-center gap-1.5 font-mono">
                                {isFinished ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {t('timers.done', 'Klart!')}
                                    </span>
                                ) : (
                                    <span className={`text-sm font-bold tracking-tight ${
                                        isRunning 
                                            ? 'text-blue-600 dark:text-blue-400' 
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {formatRemainingTime(timer.remainingSeconds)}
                                    </span>
                                )}
                            </div>

                            {/* Right: Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                                {/* +1 min adjustment */}
                                {!isFinished && (
                                    <button
                                        type="button"
                                        onClick={() => onAdjust(timer.id, 60)}
                                        className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        title={t('timers.addMinute', '+1 min')}
                                    >
                                        +1m
                                    </button>
                                )}

                                {/* Play / Pause */}
                                {!isFinished ? (
                                    <button
                                        type="button"
                                        onClick={() => onToggle(timer.id)}
                                        className={`p-1.5 rounded-lg text-white font-medium transition-colors ${
                                            isRunning
                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                        title={isRunning ? t('timers.pause', 'Pausa') : t('timers.resume', 'Starta')}
                                    >
                                        {isRunning ? <Pause size={13} /> : <Play size={13} />}
                                    </button>
                                ) : (
                                    /* Restart after finish */
                                    <button
                                        type="button"
                                        onClick={() => onReset(timer.id)}
                                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                        title={t('timers.start', 'Starta om')}
                                    >
                                        <RotateCcw size={13} />
                                    </button>
                                )}

                                {/* Reset button (when not finished) */}
                                {!isFinished && (
                                    <button
                                        type="button"
                                        onClick={() => onReset(timer.id)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title={t('timers.reset', 'Återställ')}
                                    >
                                        <RotateCcw size={13} />
                                    </button>
                                )}

                                {/* Dismiss / Close */}
                                <button
                                    type="button"
                                    onClick={() => onRemove(timer.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={t('timers.dismiss', 'Stäng')}
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
