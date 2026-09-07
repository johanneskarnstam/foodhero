import { test, expect } from '@playwright/test';

test.describe('BottomNav Component', () => {
  // These tests require authentication to see the BottomNav component
  // They are skipped by default and should be enabled when Firebase Emulator is set up
  test.skip('should display navigation tabs', async ({ page }) => {
    await page.goto('/buymilk/');
    const homeTab = page.locator('text=Hem');
    const shoppingTab = page.locator('text=Inköp');
    const mealplanTab = page.locator('text=Matsedel');
    const mealsTab = page.locator('text=Recept');
    const moreTab = page.locator('text=Mer');

    await expect(homeTab).toBeVisible();
    await expect(shoppingTab).toBeVisible();
    await expect(mealplanTab).toBeVisible();
    await expect(mealsTab).toBeVisible();
    await expect(moreTab).toBeVisible();
  });

  test.skip('should highlight active tab', async ({ page }) => {
    await page.goto('/buymilk/');
    // The home tab should be active on the home page
    const homeTab = page.locator('text=Hem');
    await expect(homeTab).toHaveClass(/text-blue-600|dark:text-blue-400/);
  });

  test.skip('should navigate to mealplan page', async ({ page }) => {
    await page.goto('/buymilk/');
    const mealplanTab = page.locator('text=Matsedel');
    await mealplanTab.click();
    await expect(page).toHaveURL('/buymilk/mealplan');
  });

  test.skip('should navigate to meals page', async ({ page }) => {
    await page.goto('/buymilk/');
    const mealsTab = page.locator('text=Recept');
    await mealsTab.click();
    await expect(page).toHaveURL('/buymilk/meals');
  });
});
