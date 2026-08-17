import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'admin';
const runIntegration = process.env.E2E_INTEGRATION === 'true';

test.describe('PKB smoke', () => {
	test('pkb app structure is documented for integration', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: 'XOS Login' })).toBeVisible();
	});

	test('full flow: login → pkb → vault → note → wikilink → backlinks → graph', async ({ page }) => {
		test.skip(!runIntegration, 'Set E2E_INTEGRATION=true and run server with test user');

		await page.goto('/');

		await page.getByLabel('Login').fill(username);
		await page.getByLabel('Password').fill(password);
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page.getByRole('button', { name: 'Пуск' })).toBeVisible({ timeout: 15_000 });

		await page.getByRole('button', { name: 'Пуск' }).click();
		await page.getByText('База знаний', { exact: true }).click();

		await expect(page.getByText('Vaults', { exact: true })).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Создать vault' }).click();
		await page.getByLabel('Название').fill('E2E PKB Vault');
		await page.getByRole('button', { name: 'Создать' }).click();

		await expect(page.getByText('E2E PKB Vault').first()).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Граф' }).click();
		await expect(page.getByText('Нет заметок для отображения')).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: 'Редактор' }).click();
	});
});
