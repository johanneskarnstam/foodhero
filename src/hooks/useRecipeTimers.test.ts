import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecipeTimers } from './useRecipeTimers';
import * as timerUtils from '../utils/timerUtils';

describe('useRecipeTimers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('starts with empty timers array', () => {
        const { result } = renderHook(() => useRecipeTimers());
        expect(result.current.timers).toEqual([]);
    });

    it('adds and starts a new timer', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 900, '15 min');
        });

        expect(result.current.timers).toHaveLength(1);
        expect(result.current.timers[0].stepIndex).toBe(0);
        expect(result.current.timers[0].stepNumber).toBe(1);
        expect(result.current.timers[0].totalSeconds).toBe(900);
        expect(result.current.timers[0].remainingSeconds).toBe(900);
        expect(result.current.timers[0].isRunning).toBe(true);
        expect(result.current.timers[0].isFinished).toBe(false);
    });

    it('ticks down seconds when running', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 10, '10 s');
        });

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.timers[0].remainingSeconds).toBe(7);
        expect(result.current.timers[0].isRunning).toBe(true);
    });

    it('completes timer when countdown reaches zero', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 3, '3 s');
        });

        act(() => {
            vi.advanceTimersByTime(3500);
        });

        expect(result.current.timers[0].remainingSeconds).toBe(0);
        expect(result.current.timers[0].isRunning).toBe(false);
        expect(result.current.timers[0].isFinished).toBe(true);
    });

    it('plays the saved signal, reports completion, and allows stopping it', () => {
        let onAutoStop: (() => void) | undefined;
        const playAlert = vi.spyOn(timerUtils, 'playTimerAlert').mockImplementation((_signal, callback) => {
            onAutoStop = callback;
        });
        const stopAlert = vi.spyOn(timerUtils, 'stopTimerAlert').mockImplementation(() => {});
        const onTimerFinished = vi.fn();
        localStorage.setItem(timerUtils.TIMER_SIGNAL_STORAGE_KEY, 'chime');

        const { result } = renderHook(() => useRecipeTimers(onTimerFinished));
        act(() => result.current.startOrAddTimer(0, 1, 1, '1 s'));
        act(() => vi.advanceTimersByTime(1000));

        expect(result.current.isAlarmPlaying).toBe(true);
        expect(playAlert).toHaveBeenCalledWith('chime', expect.any(Function));
        expect(onTimerFinished).toHaveBeenCalledWith(expect.objectContaining({ stepNumber: 1, label: '1 s' }));

        act(() => result.current.stopAlarm());
        expect(result.current.isAlarmPlaying).toBe(false);
        expect(stopAlert).toHaveBeenCalledOnce();
        expect(onAutoStop).toEqual(expect.any(Function));
    });

    it('allows multiple timers to run concurrently', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 900, '15 min');
            result.current.startOrAddTimer(1, 2, 300, '5 min');
        });

        expect(result.current.timers).toHaveLength(2);

        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(result.current.timers[0].remainingSeconds).toBe(890);
        expect(result.current.timers[1].remainingSeconds).toBe(290);
    });

    it('toggles pause and resume', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 60, '1 min');
        });

        const timerId = result.current.timers[0].id;

        act(() => {
            result.current.toggleTimer(timerId);
        });

        expect(result.current.timers[0].isRunning).toBe(false);

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // Seconds should not decrease while paused
        expect(result.current.timers[0].remainingSeconds).toBe(60);

        act(() => {
            result.current.toggleTimer(timerId);
        });

        expect(result.current.timers[0].isRunning).toBe(true);
    });

    it('adjusts timer by delta seconds', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 60, '1 min');
        });

        const timerId = result.current.timers[0].id;

        act(() => {
            result.current.adjustTimer(timerId, 60);
        });

        expect(result.current.timers[0].remainingSeconds).toBe(120);
    });

    it('resets timer to original totalSeconds', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 60, '1 min');
        });

        act(() => {
            vi.advanceTimersByTime(20000);
        });

        const timerId = result.current.timers[0].id;

        act(() => {
            result.current.resetTimer(timerId);
        });

        expect(result.current.timers[0].remainingSeconds).toBe(60);
        expect(result.current.timers[0].isRunning).toBe(false);
        expect(result.current.timers[0].isFinished).toBe(false);
    });

    it('removes a timer', () => {
        const { result } = renderHook(() => useRecipeTimers());

        act(() => {
            result.current.startOrAddTimer(0, 1, 60, '1 min');
        });

        const timerId = result.current.timers[0].id;

        act(() => {
            result.current.removeTimer(timerId);
        });

        expect(result.current.timers).toHaveLength(0);
    });
});
