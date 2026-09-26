import { useState, useEffect, useCallback, useRef } from 'react';
import { getTimerSignal, playTimerAlert, stopTimerAlert } from '../utils/timerUtils';

export interface RecipeTimer {
    id: string;
    stepIndex: number;
    stepNumber: number;
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
    isRunning: boolean;
    isFinished: boolean;
}

export const useRecipeTimers = () => {
    const [timers, setTimers] = useState<RecipeTimer[]>([]);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const timersRef = useRef(timers);
    timersRef.current = timers;
    const finishedTimerIds = useRef(new Set<string>());

    const stopAlarm = useCallback(() => {
        stopTimerAlert();
        setIsAlarmPlaying(false);
    }, []);

    // Start or add a timer for a specific step
    const startOrAddTimer = useCallback((
        stepIndex: number,
        stepNumber: number,
        durationSeconds: number,
        label: string
    ) => {
        setTimers(prev => {
            // Check if there is already a timer for this step and label
            const existing = prev.find(t => t.stepIndex === stepIndex && t.label === label);
            if (existing) {
                return prev.map(t => {
                    if (t.id === existing.id) {
                        if (t.isFinished) {
                            return {
                                ...t,
                                remainingSeconds: t.totalSeconds,
                                isRunning: true,
                                isFinished: false
                            };
                        }
                        return { ...t, isRunning: true };
                    }
                    return t;
                });
            }

            const newTimer: RecipeTimer = {
                id: `timer-${stepIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                stepIndex,
                stepNumber,
                label,
                totalSeconds: durationSeconds,
                remainingSeconds: durationSeconds,
                isRunning: true,
                isFinished: false
            };

            return [...prev, newTimer];
        });
    }, []);

    // Toggle pause/play
    const toggleTimer = useCallback((id: string) => {
        if (timersRef.current.some((timer) => timer.id === id && timer.isFinished)) {
            stopAlarm();
        }
        setTimers(prev => prev.map(t => {
            if (t.id === id) {
                if (t.isFinished) {
                    return {
                        ...t,
                        remainingSeconds: t.totalSeconds,
                        isRunning: true,
                        isFinished: false
                    };
                }
                return { ...t, isRunning: !t.isRunning };
            }
            return t;
        }));
    }, [stopAlarm]);

    // Reset timer
    const resetTimer = useCallback((id: string) => {
        if (timersRef.current.some((timer) => timer.id === id && timer.isFinished)) {
            stopAlarm();
        }
        setTimers(prev => prev.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    remainingSeconds: t.totalSeconds,
                    isRunning: false,
                    isFinished: false
                };
            }
            return t;
        }));
    }, [stopAlarm]);

    // Adjust timer by delta seconds (e.g. +60)
    const adjustTimer = useCallback((id: string, deltaSeconds: number) => {
        setTimers(prev => prev.map(t => {
            if (t.id === id) {
                const updatedRemaining = Math.max(0, t.remainingSeconds + deltaSeconds);
                return {
                    ...t,
                    remainingSeconds: updatedRemaining,
                    isFinished: updatedRemaining === 0 ? t.isFinished : false
                };
            }
            return t;
        }));
    }, []);

    // Remove timer
    const removeTimer = useCallback((id: string) => {
        if (timersRef.current.some((timer) => timer.id === id && timer.isFinished)) {
            stopAlarm();
        }
        setTimers(prev => prev.filter(t => t.id !== id));
    }, [stopAlarm]);

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        stopAlarm();
        setTimers([]);
        finishedTimerIds.current.clear();
    }, [stopAlarm]);

    useEffect(() => {
        const currentFinishedTimerIds = new Set(
            timers.filter((timer) => timer.isFinished).map((timer) => timer.id)
        );
        const hasNewlyFinishedTimer = [...currentFinishedTimerIds].some(
            (id) => !finishedTimerIds.current.has(id)
        );
        finishedTimerIds.current = currentFinishedTimerIds;

        if (hasNewlyFinishedTimer) {
            setIsAlarmPlaying(true);
            playTimerAlert(getTimerSignal(), () => setIsAlarmPlaying(false));
        }
    }, [timers]);

    // Active ticking effect
    useEffect(() => {
        const hasRunning = timers.some(t => t.isRunning && !t.isFinished);
        if (!hasRunning) return;

        const interval = setInterval(() => {
            setTimers(prev => {
                const next = prev.map(t => {
                    if (!t.isRunning || t.isFinished) return t;

                    if (t.remainingSeconds <= 1) {
                        return {
                            ...t,
                            remainingSeconds: 0,
                            isRunning: false,
                            isFinished: true
                        };
                    }

                    return {
                        ...t,
                        remainingSeconds: t.remainingSeconds - 1
                    };
                });

                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timers]);

    return {
        timers,
        startOrAddTimer,
        toggleTimer,
        resetTimer,
        adjustTimer,
        removeTimer,
        clearAllTimers,
        isAlarmPlaying,
        stopAlarm,
    };
};
