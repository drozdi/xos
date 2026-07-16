import { expect, test } from '@playwright/test';

test('start menu theme switch updates color scheme', async ({ page }) => {
	await page.goto('/');

	await page.evaluate(() => {
		localStorage.setItem('xos.access_token', 'test-token');
		localStorage.setItem('xos.refresh_token', 'test-refresh');
		localStorage.setItem('xos.settings.USER.theme', JSON.stringify('dark'));
	});

	await page.route('**/api/login-check', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ status: 'authenticated' }),
		});
	});

	await page.route('**/api/user', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: 1,
				email: 'admin@test.local',
				login: 'admin',
				alias: 'Admin',
			}),
		});
	});

	await page.reload();

	await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark');

	await page.getByRole('button', { name: 'Пуск' }).click();
	await page.getByText('Светлая', { exact: true }).click();

	await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light');
	await expect
		.poll(async () =>
			page.evaluate(() => localStorage.getItem('xos.settings.USER.theme')),
		)
		.toBe(JSON.stringify('light'));
});
