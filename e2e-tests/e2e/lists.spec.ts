import { test, expect } from '@playwright/test';
import { signInWithGoogle, createNewList, addItemToList, deleteItemFromList } from '../fixtures/utils';

test.describe('Shopping Lists', () => {
  // These tests require authentication to access the lists page
  // They use Mock Auth for testing
  
  test.beforeEach(async ({ page }) => {
    await signInWithGoogle(page);
    await page.goto('/buymilk/shopping');
    // Wait for shopping page to be fully loaded
    await expect(page).toHaveURL('/buymilk/shopping', { timeout: 15000 });
  });

  test('should display the shopping page', async ({ page }) => {
    await expect(page).toHaveURL('/buymilk/shopping');
  });

  test('should show add item input', async ({ page }) => {
    const addInput = page.locator('input[placeholder*="Lägg till"]');
    await expect(addInput).toBeVisible({ timeout: 15000 });
  });

  // These tests require authentication
  test('should create a new list', async ({ page }) => {
    await createNewList(page, 'Groceries');
  });

  test('should add item to list', async ({ page }) => {
    await addItemToList(page, 'Milk');
  });

  test('should delete item from list', async ({ page }) => {
    await addItemToList(page, 'Test Item');
    await deleteItemFromList(page, 'Test Item');
  });
});
