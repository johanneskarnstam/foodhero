import { test, expect } from '@playwright/test';
import { signInWithGoogle } from '../fixtures/utils';

test.describe('BottomNav Component', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone size
  // These tests require authentication to see the BottomNav component
  // They use Firebase Emulator for testing
  test('should display navigation tabs', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/');
    const homeTab = page.locator('nav a:has-text("Hem")').first;
    const shoppingTab = page.locator('nav a:has-text("Inköp")').first;
    const mealplanTab = page.locator('nav a:has-text("Matsedel")').first;
    const mealsTab = page.locator('nav a:has-text("Recept")').first;
    const moreTab = page.locator('nav a:has-text("Mer")').first;

    await expect(homeTab).toBeVisible();
    await expect(shoppingTab).toBeVisible();
    await expect(mealplanTab).toBeVisible();
    await expect(mealsTab).toBeVisible();
    await expect(moreTab).toBeVisible();
  });

  test('should highlight active tab', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/');
    // The home tab should be active on the home page
    const homeTab = page.locator('nav a:has-text("Hem")').first;
    await expect(homeTab).toHaveClass(/text-blue-600|dark:text-blue-400/);
  });

  test('should navigate to mealplan page', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/');
    const mealplanTab = page.locator('nav a:has-text("Matsedel")').first;
    await mealplanTab.click();
    await expect(page).toHaveURL('/buymilk/mealplan');
  });

  test('should navigate to meals page', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/');
    const mealsTab = page.locator('nav a:has-text("Recept")').first;
    await mealsTab.click();
    await expect(page).toHaveURL('/buymilk/meals');
  });
});
