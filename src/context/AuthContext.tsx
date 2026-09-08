import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user interface for testing - extends User to allow partial mocking
interface MockUserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
}

// Create a mock user object that satisfies the User interface as much as possible
const createMockUser = (data: MockUserData): User => {
    return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        emailVerified: data.emailVerified,
        isAnonymous: false,
        tenantId: undefined,
        providerData: [{
            providerId: 'google.com',
            uid: data.uid,
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            phoneNumber: null,
        }],
        metadata: {
            creationTime: Date.now().toString(),
            lastSignInTime: Date.now().toString(),
        },
        refreshToken: 'mock-refresh-token',
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({ 
            token: 'mock-token', 
            expirationTime: Date.now() + 3600000, 
            claims: {},
            authTime: Date.now().toString(),
            issuedAtTime: Date.now().toString(),
            signInProvider: 'google.com',
            signInSecondFactor: null,
        }),
        reload: async () => {},
        toJSON: () => data,
        delete: async () => {},
    } as unknown as User;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for mock user in localStorage (for testing)
        if (typeof window !== 'undefined') {
            const mockUserStr = localStorage.getItem('firebase:authUser');
            if (mockUserStr) {
                try {
                    const mockUser: MockUserData = JSON.parse(mockUserStr);
                    setUser(createMockUser(mockUser));
                    setLoading(false);
                    return;
                } catch (error) {
                    console.warn('Failed to parse mock user:', error);
                }
            }
        }

        // Regular Firebase auth listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Listen for auth state changes from localStorage (for testing)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleAuthStateChange = () => {
                const mockUserStr = localStorage.getItem('firebase:authUser');
                if (mockUserStr) {
                    try {
                        const mockUser: MockUserData = JSON.parse(mockUserStr);
                        setUser(createMockUser(mockUser));
                    } catch (error) {
                        console.warn('Failed to parse mock user:', error);
                    }
                } else {
                    // If mock user is removed, set user to null
                    setUser(null);
                }
            };

            window.addEventListener('authStateChanged', handleAuthStateChange);
            return () => window.removeEventListener('authStateChanged', handleAuthStateChange);
        }
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with email and password", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // Also clear mock user if in test mode
            if (typeof window !== 'undefined') {
                localStorage.removeItem('firebase:authUser');
            }
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
