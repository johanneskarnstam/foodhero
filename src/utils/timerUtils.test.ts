import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
    getTimerSignal,
    parseStepTimers,
    formatRemainingTime,
    formatDurationLabel,
    parseTimerSignal,
    playTimerAlert,
    saveTimerSignal,
    stopTimerAlert,
    TIMER_ALERT_DURATION_MS,
    TIMER_SIGNAL_OPTIONS,
    TIMER_SIGNAL_STORAGE_KEY,
} from './timerUtils';

describe('timerUtils', () => {
    describe('timer signal preference', () => {
        it('offers six signals', () => {
            expect(TIMER_SIGNAL_OPTIONS).toHaveLength(6);
        });

        it('defaults to the classic signal and stores a selected signal', () => {
            localStorage.removeItem(TIMER_SIGNAL_STORAGE_KEY);
            expect(getTimerSignal()).toBe('classic');

            saveTimerSignal('bell');
            expect(getTimerSignal()).toBe('bell');
        });

        it('falls back to the classic signal for invalid stored values', () => {
            expect(parseTimerSignal('unknown')).toBe('classic');
        });
    });

    describe('timer alert playback', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => {
            stopTimerAlert();
            vi.useRealTimers();
        });

        it('automatically stops and notifies after 20 seconds', () => {
            const onAutoStop = vi.fn();
            playTimerAlert('digital', onAutoStop);

            vi.advanceTimersByTime(TIMER_ALERT_DURATION_MS - 1);
            expect(onAutoStop).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(onAutoStop).toHaveBeenCalledOnce();
            expect(TIMER_ALERT_DURATION_MS).toBe(20_000);
        });

        it('repeats the selected sound pattern until stopped', () => {
            const originalAudioContext = window.AudioContext;
            class FakeAudioContext {
                static instance: FakeAudioContext;
                currentTime = 0;
                state: AudioContextState = 'running';
                destination = {} as AudioDestinationNode;
                createOscillator = vi.fn(() => ({
                    type: 'sine' as OscillatorType,
                    frequency: { setValueAtTime: vi.fn() },
                    connect: vi.fn(),
                    start: vi.fn(),
                    stop: vi.fn(),
                    onended: null as (() => void) | null,
                }));
                createGain = vi.fn(() => ({
                    gain: {
                        setValueAtTime: vi.fn(),
                        exponentialRampToValueAtTime: vi.fn(),
                    },
                    connect: vi.fn(),
                }));
                close = vi.fn().mockResolvedValue(undefined);
                resume = vi.fn().mockResolvedValue(undefined);

                constructor() {
                    FakeAudioContext.instance = this;
                }
            }

            try {
                Object.defineProperty(window, 'AudioContext', {
                    configurable: true,
                    value: FakeAudioContext,
                });
                playTimerAlert('digital');
                expect(FakeAudioContext.instance.createOscillator).toHaveBeenCalledTimes(3);

                vi.advanceTimersByTime(950);
                expect(FakeAudioContext.instance.createOscillator).toHaveBeenCalledTimes(6);
            } finally {
                stopTimerAlert();
                Object.defineProperty(window, 'AudioContext', {
                    configurable: true,
                    value: originalAudioContext,
                });
            }
        });

        it('can be stopped manually before the timeout', () => {
            const onAutoStop = vi.fn();
            playTimerAlert('chime', onAutoStop);
            stopTimerAlert();

            vi.advanceTimersByTime(TIMER_ALERT_DURATION_MS);
            expect(onAutoStop).not.toHaveBeenCalled();
        });
    });

    describe('formatRemainingTime', () => {
        it('formats minutes and seconds correctly', () => {
            expect(formatRemainingTime(900)).toBe('15:00');
            expect(formatRemainingTime(65)).toBe('01:05');
            expect(formatRemainingTime(0)).toBe('00:00');
            expect(formatRemainingTime(-5)).toBe('00:00');
        });

        it('formats hours, minutes and seconds when hours > 0', () => {
            expect(formatRemainingTime(3665)).toBe('1:01:05');
            expect(formatRemainingTime(7200)).toBe('2:00:00');
        });
    });

    describe('formatDurationLabel', () => {
        it('formats durations nicely for badges', () => {
            expect(formatDurationLabel(900)).toBe('15 min');
            expect(formatDurationLabel(5400)).toBe('1 h 30 min');
            expect(formatDurationLabel(45)).toBe('45 s');
            expect(formatDurationLabel(3600)).toBe('1 h');
        });
    });

    describe('parseStepTimers', () => {
        it('parses standard swedish minute expressions', () => {
            const res = parseStepTimers('Koka riset i 15 minuter på låg värme.');
            expect(res).toHaveLength(1);
            expect(res[0].totalSeconds).toBe(900);
            expect(res[0].label).toBe('15 min');
        });

        it('parses swedish range expressions with upper bound', () => {
            const res = parseStepTimers('Låt sjuda i ca 10-15 min under lock.');
            expect(res).toHaveLength(1);
            expect(res[0].totalSeconds).toBe(900);
            expect(res[0].label).toBe('15 min');
        });

        it('parses compound hours and minutes in Swedish', () => {
            const res = parseStepTimers('Låt puttra i 1 timme och 30 minuter.');
            expect(res).toHaveLength(1);
            expect(res[0].totalSeconds).toBe(5400);
            expect(res[0].label).toBe('1 h 30 min');
        });

        it('parses english expressions', () => {
            const res = parseStepTimers('Bake in the oven for 45 minutes or 1 hour.');
            expect(res.length).toBeGreaterThanOrEqual(1);
            expect(res[0].totalSeconds).toBe(2700);
        });

        it('parses seconds', () => {
            const res = parseStepTimers('Stek hastigt i 30 sekunder.');
            expect(res).toHaveLength(1);
            expect(res[0].totalSeconds).toBe(30);
            expect(res[0].label).toBe('30 s');
        });

        it('does not match temperature or weight numbers', () => {
            const res = parseStepTimers('Sätt ugnen på 200 grader och tillsätt 100 g smör.');
            expect(res).toHaveLength(0);
        });

        it('handles empty or non-string inputs gracefully', () => {
            expect(parseStepTimers('')).toEqual([]);
            // @ts-expect-error test invalid input
            expect(parseStepTimers(null)).toEqual([]);
        });
    });
});
