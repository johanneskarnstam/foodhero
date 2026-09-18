import { useState, useEffect, useCallback, useRef } from 'react';

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

export const playTimerAlert = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // 3 pleasant tone beeps
        [0, 0.2, 0.4].forEach((delay, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + idx * 150, now + delay);
            gain.gain.setValueAtTime(0.25, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.18);
        });

        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate([200, 100, 200]);
        }
    } catch {
        // Silently catch audio policy blocks
    }
};

export const useRecipeTimers = () => {
    const [timers, setTimers] = useState<RecipeTimer[]>([]);
    const timersRef = useRef(timers);
    timersRef.current = timers;

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
    }, []);

    // Reset timer
    const resetTimer = useCallback((id: string) => {
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
    }, []);

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
        setTimers(prev => prev.filter(t => t.id !== id));
    }, []);

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        setTimers([]);
    }, []);

    // Active ticking effect
    useEffect(() => {
        const hasRunning = timers.some(t => t.isRunning && !t.isFinished);
        if (!hasRunning) return;

        const interval = setInterval(() => {
            setTimers(prev => {
                let finishedAny = false;
                const next = prev.map(t => {
                    if (!t.isRunning || t.isFinished) return t;

                    if (t.remainingSeconds <= 1) {
                        finishedAny = true;
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

                if (finishedAny) {
                    playTimerAlert();
                }

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
        clearAllTimers
    };
};
