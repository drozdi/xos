import { expect, test } from '@playwright/test';

test('calculator launch does not hit React update depth error', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => {
		errors.push(error.message);
	});

	await page.context().addCookies([
		{ name: 'xos_refresh', value: 'test-refresh', url: 'http://localhost:5173' },
	]);
	await page.goto('/');

	await page.route('**/api/token/refresh', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ token: 'test-token' }),
		});
	});

	await page.route('**/api/login-check', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ status: 'ok' }),
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
				roles: ['ROLE_ADMIN'],
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

	await page.reload();

	await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });

	await page.getByRole('button', { name: 'Пуск' }).click();
	await page.getByText('Calculator', { exact: true }).click();

	await expect(page.getByText('Calculator', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
	await page.waitForTimeout(1_000);

	expect(errors.some((message) => message.includes('Maximum update depth exceeded'))).toBe(false);
});
