import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ISettingAdapter, SettingCategory } from '@/core/settings/adapters/ISettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';

import {
	addToLaunchHistory,
	getLaunchHistory,
	removeFromLaunchHistory,
	restoreFromHistory,
} from '../launchHistory';

class MemoryAdapter implements ISettingAdapter {
	private store = new Map<string, unknown>();

	private key(category: SettingCategory, settingKey: string): string {
		return `${category}:${settingKey}`;
	}

	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
		return this.store.get(this.key(category, key));
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		this.store.set(this.key(category, key), value);
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		return this.store.has(this.key(category, key));
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		this.store.delete(this.key(category, key));
	}
}

describe('launchHistory', () => {
	beforeEach(() => {
		settingManager.init(new MemoryAdapter());
	});

	it('restoreFromHistory launches each entry with skipHistory', async () => {
		await addToLaunchHistory('explorer', 'default');
		await addToLaunchHistory('calendar', 'main');

		const launchApp = vi.fn().mockResolvedValue('win');
		await restoreFromHistory(launchApp);

		expect(launchApp).toHaveBeenCalledTimes(2);
		expect(launchApp).toHaveBeenNthCalledWith(1, 'explorer', {
			instanceKey: 'default',
			skipHistory: true,
		});
		expect(launchApp).toHaveBeenNthCalledWith(2, 'calendar', {
			instanceKey: 'main',
			skipHistory: true,
		});

		const history = await getLaunchHistory();
		expect(history).toHaveLength(2);
	});

	it('removeFromLaunchHistory drops closed app (close → remove semantics)', async () => {
		await addToLaunchHistory('explorer', 'default');
		await addToLaunchHistory('calendar', 'main');

		await removeFromLaunchHistory('explorer', 'default');

		await expect(getLaunchHistory()).resolves.toEqual([
			expect.objectContaining({ appId: 'calendar', instanceKey: 'main' }),
		]);
	});

	it('restoreFromHistory is no-op when history empty or manager unset', async () => {
		const launchApp = vi.fn();
		await restoreFromHistory(launchApp);
		expect(launchApp).not.toHaveBeenCalled();

		settingManager.reset();
		await restoreFromHistory(launchApp);
		expect(launchApp).not.toHaveBeenCalled();
	});
});
