import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'admin';
const runIntegration = process.env.E2E_INTEGRATION === 'true';

test.describe('XOS smoke', () => {
	test('login page is visible', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'XOS Login' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	});

	test('full flow: login → app → reload restore', async ({ page }) => {
		test.skip(!runIntegration, 'Set E2E_INTEGRATION=true and run server with test user');

		await page.goto('/');

		await page.getByLabel('Login').fill(username);
		await page.getByLabel('Password').fill(password);
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });

		await page.getByRole('button', { name: 'Пуск' }).click();
		await page.getByText('Calculator', { exact: true }).click();

		await expect(page.getByText('Calculator', { exact: false }).first()).toBeVisible({ timeout: 10_000 });

		await page.reload();

		await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('Calculator').first()).toBeVisible({ timeout: 10_000 });
	});
});
