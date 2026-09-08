import { test, expect } from '@playwright/test';
import { signInWithGoogle } from '../fixtures/utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/buymilk/');
  });

  test('should redirect to landing page when not logged in', async ({ page }) => {
    await expect(page).toHaveURL('/buymilk/');
    await expect(page.locator('text=Välkommen till BuyMilk')).toBeVisible();
  });

  test('should show sign in button on landing page', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Logga in med Google")');
    await expect(signInButton).toBeVisible();
  });

  test('should show landing page title', async ({ page }) => {
    const title = page.locator('text=Välkommen till BuyMilk');
    await expect(title).toBeVisible();
  });

  test('should show landing page subtitle', async ({ page }) => {
    const subtitle = page.locator('text=Inhandlingslista för mat');
    await expect(subtitle).toBeVisible();
  });

  // This test uses Firebase Emulator
  test('should allow user to sign in with Google', async ({ page }) => {
    await signInWithGoogle(page);
  });
});
