import { test, expect } from '@playwright/test';
import { createNewList, addItemToList } from '../fixtures/utils';

test.describe('Shopping Lists', () => {
  // These tests require authentication to access the lists page
  // They use Firebase Emulator for testing
  test('should display the shopping page', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    await expect(page).toHaveURL('/buymilk/shopping');
  });

  test('should show add item input', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    const addInput = page.locator('input[placeholder*="Lägg till"]');
    await expect(addInput).toBeVisible();
  });

  // These tests require authentication and Firebase Emulator
  test('should create a new list', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    await createNewList(page, 'Groceries');
  });

  test('should add item to list', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    await addItemToList(page, 'Milk');
  });

  test('should delete item from list', async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    await addItemToList(page, 'Test Item');
    await deleteItemFromList(page, 'Test Item');
  });
});
