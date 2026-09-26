import { describe, it, expect } from 'vitest';
import {
    getTimerSignal,
    parseStepTimers,
    formatRemainingTime,
    formatDurationLabel,
    parseTimerSignal,
    saveTimerSignal,
    TIMER_SIGNAL_STORAGE_KEY,
} from './timerUtils';

describe('timerUtils', () => {
    describe('timer signal preference', () => {
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
