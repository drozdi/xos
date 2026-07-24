import { expect, type Page, test } from '@playwright/test';

/** Minimal JWT with far-future exp so hydrate skips refresh. */
function fakeJwt(): string {
	const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
	const payload = Buffer.from(
		JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 * 24 }),
	).toString('base64url');
	return `${header}.${payload}.sig`;
}

async function mockDesktopAuth(page: Page) {
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
}

async function enterDesktop(page: Page) {
	await page.goto('/');
	await page.evaluate((token) => {
		localStorage.setItem('xos.access_token', token);
		localStorage.setItem('xos.refresh_token', 'test-refresh');
	}, fakeJwt());
	await mockDesktopAuth(page);
	await page.reload();
	await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });
}

async function openStartMenuApp(page: Page, groupLabel: string, appLabel: string) {
	await page.getByRole('button', { name: 'Пуск' }).click();
	await page.getByRole('button', { name: `Развернуть группу ${groupLabel}` }).click();
	await page.getByRole('button', { name: appLabel, exact: true }).click();
}

test.describe('Post-antd smoke (mocked API)', () => {
	test('login page renders Ant Design form', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'XOS Login' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
		await expect(page.locator('input[autocomplete="username"]').first()).toBeVisible();
	});

	test('desktop shell loads after mock auth', async ({ page }) => {
		await enterDesktop(page);
	});

	test('Main: open Users list window with antd table', async ({ page }) => {
		await enterDesktop(page);

		await page.route('**/api/main/user/**', async (route) => {
			const url = route.request().url();
			if (url.includes('/filter')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([]),
				});
				return;
			}
			if (url.includes('/list') || route.request().method() === 'POST') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'Content-Range': 'items 0-0/1' },
					body: JSON.stringify([
						{
							id: 1,
							login: 'admin',
							alias: 'Admin',
							email: 'admin@test.local',
							ou: 'HQ',
							tutor: '',
						},
					]),
				});
				return;
			}
			await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
		});

		await openStartMenuApp(page, 'Администрирование', 'Пользователи');

		await expect(page.getByText('Пользователи').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.ant-table').first()).toBeVisible({ timeout: 15_000 });
	});

	test('Device: open Устройства list with antd table', async ({ page }) => {
		await enterDesktop(page);

		await page.route('**/api/device/device/filter', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{ type: 'subheader', label: 'ПК' },
					{ value: 1, label: 'Ноутбук' },
				]),
			});
		});

		await page.route('**/api/device/device/list', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: { 'Content-Range': 'items 0-0/1' },
				body: JSON.stringify([
					{
						id: 1,
						code: 'D-001',
						location: 'Каб. 1',
						inNo: 'INV-1',
						dateCreated: '2026-01-01',
						xTimestamp: '2026-01-01',
					},
				]),
			});
		});

		await openStartMenuApp(page, 'Устройства', 'Устройства');

		await expect(page.getByText('Устройства').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.ant-table').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('D-001').first()).toBeVisible({ timeout: 15_000 });
	});

	test('IncCom standalone: email sign-in page', async ({ page }) => {
		await page.goto('/inccom/auth/sign-in');
		await expect(page.getByRole('heading', { name: /Авторизуйтесь/i })).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByLabel(/Email/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Войти/i })).toBeVisible();
	});

	test('SchoolTask: open Расписание list', async ({ page }) => {
		await enterDesktop(page);

		await page.route('**/api/schooltask/**', async (route) => {
			const url = route.request().url();
			if (url.includes('/calendar/classes') || url.includes('calendars')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([{ id: 1, name: '5А', teacher: 'Tutor', can_edit: true }]),
				});
				return;
			}
			await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
		});

		await openStartMenuApp(page, 'Школа', 'Расписание');

		await expect(page.getByText('Расписание').first()).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText('5А').first()).toBeVisible({ timeout: 15_000 });
	});
});
