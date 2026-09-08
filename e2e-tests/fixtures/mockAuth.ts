/**
 * Mock Auth Service for Playwright E2E Tests
 * 
 * Denna fil innehåller mock-funktioner för Firebase Auth
 * som kan användas i Playwright-tester utan att kräva Firebase Emulator.
 */

import { Page } from '@playwright/test';

// Mock user data
interface MockUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
}

export const mockUser: MockUser = {
    uid: 'test-user-1',
    email: 'test1@example.com',
    displayName: 'Test User 1',
    photoURL: 'https://example.com/avatar.jpg',
    emailVerified: true,
};

/**
 * Mock implementation av signInWithGoogle
 * Sätter en mock-användare i localStorage som appen kan läsa
 */
export async function mockSignInWithGoogle(page: Page): Promise<void> {
    console.log('🎭 Mocking Google Sign In');
    
    // Spara mock-användare i localStorage
    await page.evaluate((user) => {
        // Firebase format för localStorage
        const firebaseAuth = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: false,
            providerData: [{
                providerId: 'google.com',
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            }],
        };
        
        // Spara i localStorage (där Firebase lagrar auth-state)
        localStorage.setItem('firebase:authUser', JSON.stringify(firebaseAuth));
        
        // Trigger auth state change event
        window.dispatchEvent(new Event('authStateChanged'));
    }, mockUser);
    
    // Vänta en stund för att appen ska reagera
    await page.waitForTimeout(500);
    
    console.log('✅ Mock Google Sign In completed');
}

/**
 * Mock implementation av signOut
 * Tar bort mock-användaren från localStorage
 */
export async function mockSignOut(page: Page): Promise<void> {
    console.log('🎭 Mocking Sign Out');
    
    await page.evaluate(() => {
        localStorage.removeItem('firebase:authUser');
        window.dispatchEvent(new Event('authStateChanged'));
    });
    
    await page.waitForTimeout(500);
    console.log('✅ Mock Sign Out completed');
}

/**
 * Mock implementation av signInWithEmailAndPassword
 */
export async function mockSignInWithEmail(page: Page, email: string, password: string): Promise<void> {
    console.log(`🎭 Mocking Email/Password Sign In for ${email}`);
    
    await page.evaluate((user) => {
        const firebaseAuth = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: false,
            providerData: [{
                providerId: 'password',
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            }],
        };
        
        localStorage.setItem('firebase:authUser', JSON.stringify(firebaseAuth));
        window.dispatchEvent(new Event('authStateChanged'));
    }, mockUser);
    
    await page.waitForTimeout(500);
    console.log('✅ Mock Email/Password Sign In completed');
}

/**
 * Check if user is authenticated (mock)
 */
export async function isMockAuthenticated(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
        return localStorage.getItem('firebase:authUser') !== null;
    });
}

/**
 * Get current mock user
 */
export async function getMockUser(page: Page): Promise<MockUser | null> {
    return await page.evaluate(() => {
        const userStr = localStorage.getItem('firebase:authUser');
        if (!userStr) return null;
        
        try {
            const user = JSON.parse(userStr);
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
            };
        } catch {
            return null;
        }
    });
}