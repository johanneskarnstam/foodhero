import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase modules globally
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, _callback) => {
        // Call callback with null user by default
        _callback(null);
        return vi.fn(); // Return unsubscribe function
    }),
}));

vi.mock('firebase/firestore', () => ({
    initializeFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
    collection: vi.fn(() => ({})), // Return mock collection reference
    doc: vi.fn(() => ({})), // Return mock doc reference
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
    })),
}));


const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn(function (key: string) {
            return store[key] ?? null;
        }),
        setItem: vi.fn(function (key: string, value: string) {
            store[key] = value.toString();
        }),
        clear: vi.fn(function () {
            store = {};
        }),
        removeItem: vi.fn(function (key: string) {
            delete store[key];
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});
