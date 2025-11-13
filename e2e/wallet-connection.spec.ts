import { test, expect } from '@playwright/test';

// Tests rely on NEXT_PUBLIC_E2E=1 via webServer command in playwright.config.ts
// and URL param ?e2eConnected to preset initial state for determinism.

test.describe('Wallet connection flow (E2E mode)', () => {
  test('connects wallet from landing page', async ({ page }) => {
    await page.goto('/?e2eConnected=false');

    // Connect
    await page.getByRole('button', { name: 'Connect Wallet' }).click();

    // Address appears truncated
    await expect(page.getByText('0x1234...abcd')).toBeVisible();
  });

  test('disconnects wallet from dropdown', async ({ page }) => {
    await page.goto('/?e2eConnected=true');

    // Shows connected state
    await expect(page.getByText('0x1234...abcd')).toBeVisible();

    // Open dropdown and disconnect
    await page.getByText('0x1234...abcd').click();
    await page.getByRole('button', { name: 'Disconnect' }).click();

    // Back to connect button
    await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
  });
});
