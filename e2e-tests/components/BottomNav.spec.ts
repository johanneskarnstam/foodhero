import { test, expect } from '@playwright/test';
import { signInWithGoogle } from '../fixtures/utils';

test.describe('BottomNav Component', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone size
  
  test.beforeEach(async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/');
    // Wait for BottomNav to be visible - use specific class selector
    await expect(page.locator('nav.fixed.bottom-0.left-0.right-0')).toBeVisible({ timeout: 10000 });
  });
  
  test('should display navigation tabs', async ({ page }) => {
    // Use specific BottomNav selector
    const bottomNav = page.locator('nav.fixed.bottom-0.left-0.right-0');
    
    const homeTab = bottomNav.locator('a').filter({ hasText: 'Hem' });
    const shoppingTab = bottomNav.locator('a').filter({ hasText: 'Inköp' });
    const mealplanTab = bottomNav.locator('a').filter({ hasText: 'Matsedel' });
    const mealsTab = bottomNav.locator('a').filter({ hasText: 'Recept' });
    const moreTab = bottomNav.locator('button').filter({ hasText: 'Mer' });

    await expect(homeTab).toBeVisible();
    await expect(shoppingTab).toBeVisible();
    await expect(mealplanTab).toBeVisible();
    await expect(mealsTab).toBeVisible();
    await expect(moreTab).toBeVisible();
  });

  test('should highlight active tab', async ({ page }) => {
    const bottomNav = page.locator('nav.fixed.bottom-0.left-0.right-0');
    const homeTab = bottomNav.locator('a').filter({ hasText: 'Hem' });
    await expect(homeTab).toHaveClass(/text-blue-600|dark:text-blue-400/);
  });

  test('should navigate to mealplan page', async ({ page }) => {
    const bottomNav = page.locator('nav.fixed.bottom-0.left-0.right-0');
    const mealplanTab = bottomNav.locator('a').filter({ hasText: 'Matsedel' });
    await mealplanTab.click();
    await expect(page).toHaveURL('/buymilk/mealplan');
  });

  test('should navigate to meals page', async ({ page }) => {
    const bottomNav = page.locator('nav.fixed.bottom-0.left-0.right-0');
    const mealsTab = bottomNav.locator('a').filter({ hasText: 'Recept' });
    await mealsTab.click();
    await expect(page).toHaveURL('/buymilk/meals');
  });
});
