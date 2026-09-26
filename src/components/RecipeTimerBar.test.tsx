import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeTimerBar } from './RecipeTimerBar';
import { RecipeTimer } from '../hooks/useRecipeTimers';

describe('RecipeTimerBar', () => {
    const mockOnToggle = vi.fn();
    const mockOnReset = vi.fn();
    const mockOnAdjust = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnStopAlarm = vi.fn();

    const sampleTimers: RecipeTimer[] = [
        {
            id: 't-1',
            stepIndex: 0,
            stepNumber: 1,
            label: '15 min',
            totalSeconds: 900,
            remainingSeconds: 845,
            isRunning: true,
            isFinished: false
        },
        {
            id: 't-2',
            stepIndex: 1,
            stepNumber: 2,
            label: '5 min',
            totalSeconds: 300,
            remainingSeconds: 0,
            isRunning: false,
            isFinished: true
        }
    ];

    it('renders nothing when timers array is empty', () => {
        const { container } = render(
            <RecipeTimerBar
                timers={[]}
                onToggle={mockOnToggle}
                onReset={mockOnReset}
                onAdjust={mockOnAdjust}
                onRemove={mockOnRemove}
                isAlarmPlaying={false}
                onStopAlarm={mockOnStopAlarm}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders active and finished timers', () => {
        render(
            <RecipeTimerBar
                timers={sampleTimers}
                onToggle={mockOnToggle}
                onReset={mockOnReset}
                onAdjust={mockOnAdjust}
                onRemove={mockOnRemove}
                isAlarmPlaying={false}
                onStopAlarm={mockOnStopAlarm}
            />
        );

        expect(screen.getByTestId('recipe-timer-bar')).toBeInTheDocument();
        expect(screen.getByText('14:05')).toBeInTheDocument();
        expect(screen.getByText(/Klart|Done/i)).toBeInTheDocument();
    });

    it('calls callbacks for controls', () => {
        render(
            <RecipeTimerBar
                timers={sampleTimers}
                onToggle={mockOnToggle}
                onReset={mockOnReset}
                onAdjust={mockOnAdjust}
                onRemove={mockOnRemove}
                isAlarmPlaying={false}
                onStopAlarm={mockOnStopAlarm}
            />
        );

        // Adjust +1m
        const adjustBtn = screen.getByText('+1m');
        fireEvent.click(adjustBtn);
        expect(mockOnAdjust).toHaveBeenCalledWith('t-1', 60);

        // Toggle pause/play
        const pauseBtn = screen.getByTitle(/Pausa|Pause/i);
        fireEvent.click(pauseBtn);
        expect(mockOnToggle).toHaveBeenCalledWith('t-1');

        // Reset
        const resetBtn = screen.getByTitle(/Återställ|Reset/i);
        fireEvent.click(resetBtn);
        expect(mockOnReset).toHaveBeenCalledWith('t-1');

        // Dismiss / Remove
        const dismissBtns = screen.getAllByTitle(/Stäng|Dismiss/i);
        fireEvent.click(dismissBtns[0]);
        expect(mockOnRemove).toHaveBeenCalledWith('t-1');
    });

    it('shows a stop control while the alarm is playing', () => {
        render(
            <RecipeTimerBar
                timers={sampleTimers}
                onToggle={mockOnToggle}
                onReset={mockOnReset}
                onAdjust={mockOnAdjust}
                onRemove={mockOnRemove}
                isAlarmPlaying={true}
                onStopAlarm={mockOnStopAlarm}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Stoppa ljudet/i }));
        expect(mockOnStopAlarm).toHaveBeenCalledOnce();
    });
});
