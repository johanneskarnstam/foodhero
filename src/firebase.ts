import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Connect to Firebase Emulator if enabled
const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true';

if (useEmulator) {
    try {
        console.log('🔥 Connecting to Firebase Emulator');
        
        // Connect Auth emulator
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        
        // Connect Firestore emulator
        connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
        console.warn('⚠️  Could not connect to Firebase Emulator:', error);
    }
}

export { useEmulator };
