import { Page, expect } from '@playwright/test';
import { mockSignInWithGoogle, mockSignInWithEmail, mockSignOut, isMockAuthenticated, getMockUser, mockUser } from './mockAuth';

// Re-export mock functions for convenience
export { mockSignInWithGoogle, mockSignInWithEmail, mockSignOut, isMockAuthenticated, getMockUser, mockUser };

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
 * Sign in with email and password using Mock
 */
export async function signInWithEmail(page: Page, email: string = 'test1@example.com', password: string = 'test123') {
  console.log(`🔐 Signing in with email: ${email}`);
  
  await page.goto('/buymilk/');
  await mockSignInWithEmail(page, email, password);
  
  // Reload to trigger auth state change
  await page.reload();
  await page.waitForURL('/buymilk/**');
  
  // Verify we're signed in by checking for BottomNav (works in any language)
  await expect(page.locator('nav.fixed.bottom-0.left-0.right-0')).toBeVisible({ timeout: 10000 });
  console.log('✅ Signed in successfully');
}

/**
 * Sign in with Google using Mock
 */
export async function signInWithGoogle(page: Page) {
  console.log('🔐 Signing in with Google (mocked)');
  
  await page.goto('/buymilk/');
  await mockSignInWithGoogle(page);
  
  // Reload to trigger auth state change
  await page.reload();
  await page.waitForURL('/buymilk/**');
  console.log('✅ Signed in with Google (mocked)');
}

/**
 * Sign out using Mock
 */
export async function signOut(page: Page) {
  console.log('🔓 Signing out');
  await mockSignOut(page);
  
  // Reload to trigger auth state change
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  console.log('✅ Signed out successfully');
}

// Helper function to create a new list
export async function createNewList(page: Page, listName: string) {
  console.log(`📝 Creating new list: ${listName}`);
  await page.click('button:text-matches("lista|list")');
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
  await page.locator(`text=${itemName}`).locator('xpath=../..//input[@type="checkbox"]').click();
  await expect(page.locator(`text=${itemName}`)).toHaveClass(/line-through/);
  console.log(`✅ Marked item as completed: ${itemName}`);
}

// Helper function to delete item from list
export async function deleteItemFromList(page: Page, itemName: string) {
  console.log(`🗑️  Deleting item: ${itemName}`);
  await page.locator(`text=${itemName}`).hover();
  await page.click('button:text-matches("bort|delete|remove")');
  if (await page.locator('text-matches("Bekräfta|Confirm")').isVisible()) {
    await page.click('button:text-matches("Ja|Yes")');
  }
  await expect(page.locator(`text=${itemName}`)).not.toBeVisible();
  console.log(`✅ Deleted item: ${itemName}`);
}
