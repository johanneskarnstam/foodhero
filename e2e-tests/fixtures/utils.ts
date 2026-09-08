import { Page, expect } from '@playwright/test';

// Firebase Emulator URLs
const FIREBASE_AUTH_EMULATOR_URL = 'http://localhost:9099';
const FIREBASE_FIRESTORE_EMULATOR_URL = 'http://localhost:8080';

// Test user credentials
interface TestUser {
  email: string;
  password: string;
  uid: string;
  displayName?: string;
}

export const testUsers: Record<string, TestUser> = {
  user1: {
    email: 'test1@example.com',
    password: 'test123',
    uid: 'test-user-1',
    displayName: 'Test User 1'
  },
  user2: {
    email: 'test2@example.com',
    password: 'test123',
    uid: 'test-user-2',
    displayName: 'Test User 2'
  }
};

/**
 * Sign in with email and password using Firebase Emulator
 */
export async function signInWithEmail(page: Page, email: string = 'test1@example.com', password: string = 'test123') {
  console.log(`🔐 Signing in with email: ${email}`);
  
  await page.goto('/buymilk/');
  await page.click('button:has-text("Logga in")');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/buymilk/**');
  await expect(page.locator('text=Mina listor')).toBeVisible({ timeout: 10000 });
  console.log('✅ Signed in successfully');
}

/**
 * Sign in with Google using Firebase Emulator (mocked)
 */
export async function signInWithGoogle(page: Page) {
  console.log('🔐 Signing in with Google (mocked)');
  
  await page.goto('/buymilk/');
  await page.click('button:has-text("Logga in med Google")');
  
  await page.evaluate((emulatorUrl) => {
    const mockUser = {
      uid: 'test-user-1',
      email: 'test1@example.com',
      displayName: 'Test User 1',
      photoURL: 'https://example.com/avatar.jpg',
      emailVerified: true
    };
    localStorage.setItem('firebase:authUser', JSON.stringify(mockUser));
  }, FIREBASE_AUTH_EMULATOR_URL);
  
  await page.reload();
  await page.waitForURL('/buymilk/**');
  console.log('✅ Signed in with Google (mocked)');
}

/**
 * Sign out from Firebase Emulator
 */
export async function signOut(page: Page) {
  console.log('🔓 Signing out');
  await page.click('button:has-text("Logga ut")');
  await expect(page.locator('text=Välkommen till BuyMilk')).toBeVisible();
  console.log('✅ Signed out successfully');
}

// Helper function to create a new list
export async function createNewList(page: Page, listName: string) {
  console.log(`📝 Creating new list: ${listName}`);
  await page.click('button:has-text("Ny lista")');
  await page.fill('input[name="listName"]', listName);
  await page.click('button[type="submit"]');
  await expect(page.locator(`text=${listName}`)).toBeVisible();
  console.log(`✅ Created list: ${listName}`);
}

// Helper function to add an item to a list
export async function addItemToList(page: Page, itemName: string) {
  console.log(`➕ Adding item: ${itemName}`);
  await page.fill('input[placeholder*="Lägg till"]', itemName);
  await page.keyboard.press('Enter');
  await expect(page.locator(`text=${itemName}`)).toBeVisible();
  console.log(`✅ Added item: ${itemName}`);
}

// Helper function to navigate to a list
export async function navigateToList(page: Page, listId: string) {
  await page.goto(`/buymilk/shopping?list=${listId}`);
}

// Helper function to mark item as completed
export async function markItemAsCompleted(page: Page, itemName: string) {
  console.log(`✅ Marking item as completed: ${itemName}`);
  await page.click(`text=${itemName} >> xpath=../..//input[@type="checkbox"]`);
  await expect(page.locator(`text=${itemName}`)).toHaveClass(/line-through/);
  console.log(`✅ Marked item as completed: ${itemName}`);
}

// Helper function to delete item from list
export async function deleteItemFromList(page: Page, itemName: string) {
  console.log(`🗑️  Deleting item: ${itemName}`);
  await page.locator(`text=${itemName}`).hover();
  await page.click('button:has-text("Ta bort")');
  if (await page.locator('text=Bekräfta radering').isVisible()) {
    await page.click('button:has-text("Ja")');
  }
  await expect(page.locator(`text=${itemName}`)).not.toBeVisible();
  console.log(`✅ Deleted item: ${itemName}`);
}
