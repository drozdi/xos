import { expect, test } from '@playwright/test';

function fakeJwt(): string {
	const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
	const payload = Buffer.from(
		JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 * 24 }),
	).toString('base64url');
	return `${header}.${payload}.sig`;
}

test('start menu theme switch updates color scheme', async ({ page }) => {
	await page.goto('/');

	await page.evaluate((token) => {
		localStorage.setItem('xos.access_token', token);
		localStorage.setItem('xos.refresh_token', 'test-refresh');
		localStorage.setItem('xos.settings.USER.theme', JSON.stringify('dark'));
	}, fakeJwt());

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
				roles: ['ROLE_ROOT'],
				scopes: {},
			}),
		});
	});

	await page.route('**/api/account/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({}),
		});
	});

	await page.route('**/api/token/refresh', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ token: fakeJwt(), refresh_token: 'test-refresh' }),
		});
	});

	await page.reload();

	await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	await page.getByRole('button', { name: 'Пуск' }).click();
	await page.getByRole('button', { name: 'Тема' }).click();
	await page.getByText('Светлая', { exact: true }).click();

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect
		.poll(async () => page.evaluate(() => localStorage.getItem('xos.settings.USER.theme')))
		.toBe(JSON.stringify('light'));
});
