import { test, expect } from '@playwright/test';

test.describe('MiniPay India UI', () => {
    test('has correct title and landing elements', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Check title
        await expect(page).toHaveTitle(/MiniPay India/);

        // Check main heading
        await expect(page.getByRole('heading', { name: 'MiniPay India' })).toBeVisible();

        // Check Create Wallet button
        await expect(page.getByRole('button', { name: 'Create Wallet with Passkey' })).toBeVisible();

        // Check value props
        await expect(page.getByText('No seed phrases')).toBeVisible();
        await expect(page.getByText('No gas fees')).toBeVisible();
    });

    // Note: We cannot easily test the Biometric popup in automated environment
    // mocking would be required for deeper flow testing
});
