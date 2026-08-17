import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'admin';
const runIntegration = process.env.E2E_INTEGRATION === 'true';

test.describe('Board smoke', () => {
	test('board app structure is documented for integration', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'XOS Login' })).toBeVisible();
	});

	test('full flow: login → board → workspace → card', async ({ page }) => {
		test.skip(!runIntegration, 'Set E2E_INTEGRATION=true and run server with test user');

		await page.goto('/');

		await page.getByLabel('Login').fill(username);
		await page.getByLabel('Password').fill(password);
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });

		await page.getByRole('button', { name: 'Пуск' }).click();
		await page.getByText('Доска', { exact: true }).click();

		await expect(page.getByText('Доски', { exact: true })).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Workspace' }).click();
		await page.getByLabel('Название').fill('E2E Workspace');
		await page.getByRole('button', { name: 'Создать' }).click();

		await expect(page.getByText('E2E Workspace')).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Доска' }).click();
		await page.getByLabel('Название').fill('E2E Board');
		await page.getByRole('button', { name: 'Создать' }).click();

		await page.getByText('E2E Board').click();

		await expect(page.getByText('E2E Board').first()).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Добавить список' }).click();
		await page.getByPlaceholder('Название списка').fill('To Do');
		await page.getByRole('button', { name: 'Добавить' }).first().click();

		await page.getByRole('button', { name: 'Карточка' }).click();
		await page.getByPlaceholder('Название карточки').fill('E2E Card');
		await page.getByRole('button', { name: 'Добавить' }).click();

		await page.getByText('E2E Card').click();

		await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
	});
});
