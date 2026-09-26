export interface DetectedTimer {
    raw: string;
    label: string;
    totalSeconds: number;
}

export const TIMER_SIGNAL_STORAGE_KEY = 'foodhero.timerSignal';
export const TIMER_SIGNAL_OPTIONS = ['classic', 'bell', 'soft', 'digital', 'alarm', 'chime'] as const;
export type TimerSignal = typeof TIMER_SIGNAL_OPTIONS[number];
export const TIMER_ALERT_DURATION_MS = 20_000;

interface TimerSignalPreset {
    waveform: OscillatorType;
    volume: number;
    repeatMs: number;
    tones: { frequency: number; delay: number; duration: number }[];
    vibration: number[];
}

const TIMER_SIGNAL_PRESETS: Record<TimerSignal, TimerSignalPreset> = {
    classic: {
        waveform: 'sine',
        volume: 0.25,
        repeatMs: 1100,
        tones: [
            { frequency: 800, delay: 0, duration: 0.18 },
            { frequency: 950, delay: 0.2, duration: 0.18 },
            { frequency: 1100, delay: 0.4, duration: 0.18 },
        ],
        vibration: [200, 100, 200],
    },
    bell: {
        waveform: 'triangle',
        volume: 0.22,
        repeatMs: 1200,
        tones: [
            { frequency: 880, delay: 0, duration: 0.32 },
            { frequency: 1175, delay: 0.24, duration: 0.32 },
            { frequency: 1568, delay: 0.48, duration: 0.38 },
        ],
        vibration: [260, 90, 260],
    },
    soft: {
        waveform: 'sine',
        volume: 0.16,
        repeatMs: 1400,
        tones: [
            { frequency: 523, delay: 0, duration: 0.45 },
            { frequency: 659, delay: 0.36, duration: 0.45 },
        ],
        vibration: [120, 80, 120],
    },
    digital: {
        waveform: 'square',
        volume: 0.14,
        repeatMs: 950,
        tones: [
            { frequency: 988, delay: 0, duration: 0.12 },
            { frequency: 1319, delay: 0.17, duration: 0.12 },
            { frequency: 1568, delay: 0.34, duration: 0.18 },
        ],
        vibration: [100, 80, 100],
    },
    alarm: {
        waveform: 'sawtooth',
        volume: 0.12,
        repeatMs: 900,
        tones: [
            { frequency: 740, delay: 0, duration: 0.24 },
            { frequency: 880, delay: 0.28, duration: 0.24 },
        ],
        vibration: [180, 80, 180],
    },
    chime: {
        waveform: 'sine',
        volume: 0.2,
        repeatMs: 1500,
        tones: [
            { frequency: 1047, delay: 0, duration: 0.5 },
            { frequency: 1319, delay: 0.2, duration: 0.5 },
            { frequency: 1568, delay: 0.4, duration: 0.6 },
        ],
        vibration: [140, 100, 140],
    },
};

let activeAudioContext: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let patternInterval: ReturnType<typeof setInterval> | null = null;
let autoStopTimeout: ReturnType<typeof setTimeout> | null = null;
let onAlertAutoStop: (() => void) | null = null;

export const parseTimerSignal = (value: string | null): TimerSignal =>
    TIMER_SIGNAL_OPTIONS.find((signal) => signal === value) ?? 'classic';

export const getTimerSignal = (): TimerSignal =>
    typeof window === 'undefined'
        ? 'classic'
        : parseTimerSignal(window.localStorage.getItem(TIMER_SIGNAL_STORAGE_KEY));

export const saveTimerSignal = (signal: TimerSignal): void => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(TIMER_SIGNAL_STORAGE_KEY, signal);
    }
};

export const stopTimerAlert = (): void => {
    if (patternInterval !== null) {
        clearInterval(patternInterval);
        patternInterval = null;
    }
    if (autoStopTimeout !== null) {
        clearTimeout(autoStopTimeout);
        autoStopTimeout = null;
    }

    activeOscillators.forEach((oscillator) => {
        try {
            oscillator.stop();
        } catch {
            // Oscillator may already have stopped.
        }
    });
    activeOscillators = [];

    const context = activeAudioContext;
    activeAudioContext = null;
    if (context && context.state !== 'closed') {
        void context.close();
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
    }
    onAlertAutoStop = null;
};

export const playTimerAlert = (
    signal: TimerSignal = getTimerSignal(),
    onAutoStop?: () => void
): void => {
    stopTimerAlert();
    const preset = TIMER_SIGNAL_PRESETS[signal];
    onAlertAutoStop = onAutoStop ?? null;
    autoStopTimeout = setTimeout(() => {
        const callback = onAlertAutoStop;
        stopTimerAlert();
        callback?.();
    }, TIMER_ALERT_DURATION_MS);

    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const context = new AudioContextClass();
        activeAudioContext = context;
        const playPattern = () => {
            if (context.state === 'closed') return;
            if (context.state === 'suspended') void context.resume();
            const now = context.currentTime;

            preset.tones.forEach(({ frequency, delay, duration }) => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                activeOscillators.push(oscillator);
                oscillator.type = preset.waveform;
                oscillator.frequency.setValueAtTime(frequency, now + delay);
                gain.gain.setValueAtTime(preset.volume, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.onended = () => {
                    activeOscillators = activeOscillators.filter((active) => active !== oscillator);
                };
                oscillator.start(now + delay);
                oscillator.stop(now + delay + duration);
            });
            if (typeof navigator.vibrate === 'function') {
                navigator.vibrate(preset.vibration);
            }
        };

        playPattern();
        patternInterval = setInterval(playPattern, preset.repeatMs);
    } catch {
        // Audio may be blocked by browser policy; the stop control still remains available.
    }
};

/**
 * Format seconds into MM:SS or H:MM:SS
 */
export const formatRemainingTime = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Format duration for badges/labels, e.g. "15 min", "1 h 30 min", "45 sek"
 */
export const formatDurationLabel = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours} h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} min`);
    }
    if (seconds > 0 && hours === 0) {
        parts.push(`${seconds} s`);
    }

    return parts.join(' ') || '0 s';
};

/**
 * Parses cooking time mentions in instructions text.
 * Handles Swedish & English expressions such as:
 * - "15 minuter", "15 min", "10-15 min", "15 mins", "15m"
 * - "1 timme", "2 timmar", "1.5 timmar", "1 h", "2 hours"
 * - "1 timme och 30 minuter", "1 h 15 min", "1 hour 20 mins"
 * - "45 sekunder", "30 sek", "45 secs"
 */
export const parseStepTimers = (text: string): DetectedTimer[] => {
    if (!text || typeof text !== 'string') return [];

    const results: DetectedTimer[] = [];
    const seenRaws = new Set<string>();

    // 1. Compound hours + minutes (e.g. "1 timme och 30 minuter", "1 h 20 min", "1 hour and 15 mins")
    const compoundRegex = /\b(\d+(?:[.,]\d+)?)\s*(?:tim(?:me|mar)?|h(?:r|rs|our|ours)?)\s*(?:och|and|\+)?\s*(\d+)\s*(?:min(?:utes?|ut(?:er)?)?|mins?|m)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = compoundRegex.exec(text)) !== null) {
        const raw = match[0];
        const hours = parseFloat(match[1].replace(',', '.'));
        const mins = parseInt(match[2], 10);
        const totalSeconds = Math.round(hours * 3600 + mins * 60);

        if (totalSeconds > 0 && !seenRaws.has(raw.toLowerCase())) {
            seenRaws.add(raw.toLowerCase());
            results.push({
                raw,
                label: formatDurationLabel(totalSeconds),
                totalSeconds
            });
        }
    }

    // Replace matched compounds with spaces to avoid duplicate sub-matches
    let scrubbedText = text;
    for (const item of results) {
        scrubbedText = scrubbedText.replace(item.raw, ' '.repeat(item.raw.length));
    }

    // 2. Single or range durations
    // Matches:
    // Numbers/ranges: "15", "10-15", "10 - 15", "1,5", "1.5"
    // Followed by units: hours, minutes, seconds
    const unitRegex = /\b(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|till|to)\s*(\d+(?:[.,]\d+)?))?\s*(tim(?:me|mar)?|h(?:r|rs|our|ours)?|min(?:utes?|ut(?:er)?)?|mins?|sek(?:und(?:er)?)?|sec(?:ond)?s?)\b/gi;

    while ((match = unitRegex.exec(scrubbedText)) !== null) {
        const raw = match[0];
        if (seenRaws.has(raw.toLowerCase())) continue;

        const num1 = parseFloat(match[1].replace(',', '.'));
        const num2 = match[2] ? parseFloat(match[2].replace(',', '.')) : null;
        // For ranges like "10-15 min", pick upper bound for timer default
        const value = num2 !== null ? num2 : num1;
        const unit = match[3].toLowerCase();

        let totalSeconds = 0;
        if (/^(tim|h)/.test(unit)) {
            totalSeconds = Math.round(value * 3600);
        } else if (/^(min)/.test(unit)) {
            totalSeconds = Math.round(value * 60);
        } else if (/^(sek|sec)/.test(unit)) {
            totalSeconds = Math.round(value);
        }

        if (totalSeconds > 0) {
            seenRaws.add(raw.toLowerCase());
            results.push({
                raw,
                label: formatDurationLabel(totalSeconds),
                totalSeconds
            });
        }
    }

    return results;
};
