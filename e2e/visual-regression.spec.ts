import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('landing page matches screenshot', async ({ page }) => {
    await page.goto('/?e2eConnected=false');
    await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
  });

  test('chat page matches screenshot', async ({ page }) => {
    await page.goto('/chat?e2eConnected=true');
    await expect(page).toHaveScreenshot('chat-page.png', { fullPage: true });
  });

  test('profile page matches screenshot', async ({ page }) => {
    await page.goto('/profile?e2eConnected=true');
    await expect(page).toHaveScreenshot('profile-page.png', { fullPage: true });
  });
});
