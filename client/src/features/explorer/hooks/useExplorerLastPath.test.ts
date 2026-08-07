import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPersistTimers, setWindowDocumentPath } from '@/core/windowManager/persistWindow';
import { useWmStore } from '@/core/windowManager/useWmStore';

import {
	clearExplorerLastPathLocalBuffer,
	readExplorerLastPathLocalBuffer,
	writeExplorerLastPathLocalBuffer,
} from '../explorerLastPath';
import {
	persistExplorerFolderPath,
	readExplorerWindowDocumentPath,
	shouldHydrateExplorerGlobalLastPath,
} from './useExplorerLastPath';

const scheduleDesktopState = vi.fn();

vi.mock('@/core/settings/desktopStatePersister', () => ({
	getDesktopStatePersister: () => ({
		schedule: () => scheduleDesktopState(),
	}),
}));

function installLocalStorage(): void {
	const store: Record<string, string> = {};
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	});
}

describe('useExplorerLastPath helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearPersistTimers();
		installLocalStorage();
		clearExplorerLastPathLocalBuffer();
		useWmStore.setState({
			windows: {},
			activeWindowId: null,
			nextZIndex: 100,
		});
	});

	it('readExplorerWindowDocumentPath normalizes props.documentPath', () => {
		expect(readExplorerWindowDocumentPath({ documentPath: 'home://foo' })).toBe('home://foo/');
		expect(readExplorerWindowDocumentPath({ documentPath: '' })).toBeNull();
		expect(readExplorerWindowDocumentPath({})).toBeNull();
		expect(readExplorerWindowDocumentPath(undefined)).toBeNull();
	});

	it('shouldHydrateExplorerGlobalLastPath only for new non-picker windows without WIN path', () => {
		expect(
			shouldHydrateExplorerGlobalLastPath({
				initialPath: undefined,
				windowDocumentPath: null,
				pickerMode: undefined,
			}),
		).toBe(true);

		expect(
			shouldHydrateExplorerGlobalLastPath({
				windowDocumentPath: 'home://foo/',
			}),
		).toBe(false);

		expect(
			shouldHydrateExplorerGlobalLastPath({
				initialPath: 'home://bar/',
			}),
		).toBe(false);

		expect(
			shouldHydrateExplorerGlobalLastPath({
				pickerMode: 'open',
			}),
		).toBe(false);
	});

	it('two windowIds keep distinct documentPaths via setWindowDocumentPath', () => {
		const idA = useWmStore.getState().openWindow({
			appId: 'explorer',
			instanceKey: 'a',
			title: 'Explorer A',
		});
		const idB = useWmStore.getState().openWindow({
			appId: 'explorer',
			instanceKey: 'b',
			title: 'Explorer B',
		});

		setWindowDocumentPath(idA, 'home://foo/');
		setWindowDocumentPath(idB, 'home://bar/');

		expect(useWmStore.getState().windows[idA]?.documentPath).toBe('home://foo/');
		expect(useWmStore.getState().windows[idB]?.documentPath).toBe('home://bar/');

		setWindowDocumentPath(idA, 'home://foo/nested/');
		expect(useWmStore.getState().windows[idA]?.documentPath).toBe('home://foo/nested/');
		expect(useWmStore.getState().windows[idB]?.documentPath).toBe('home://bar/');
	});

	it('persistExplorerFolderPath writes WIN + global when enabled', () => {
		const windowId = useWmStore.getState().openWindow({
			appId: 'explorer',
			instanceKey: 'default',
			title: 'Explorer',
		});

		persistExplorerFolderPath(windowId, 'home://work/', true);

		expect(useWmStore.getState().windows[windowId]?.documentPath).toBe('home://work/');
		expect(readExplorerLastPathLocalBuffer()).toBe('home://work/');
		expect(scheduleDesktopState).toHaveBeenCalled();
	});

	it('persistExplorerFolderPath (picker) does not write WIN or global', () => {
		const explorerId = useWmStore.getState().openWindow({
			appId: 'explorer',
			instanceKey: 'main',
			title: 'Explorer',
			documentPath: 'home://keep/',
		});
		const pickerId = useWmStore.getState().openWindow({
			appId: 'explorer-open-picker',
			instanceKey: 'picker',
			title: 'Open',
		});

		writeExplorerLastPathLocalBuffer('home://keep/');

		persistExplorerFolderPath(pickerId, 'home://picker-nav/', false);

		expect(useWmStore.getState().windows[explorerId]?.documentPath).toBe('home://keep/');
		expect(useWmStore.getState().windows[pickerId]?.documentPath).toBeUndefined();
		expect(readExplorerLastPathLocalBuffer()).toBe('home://keep/');
		expect(scheduleDesktopState).not.toHaveBeenCalled();
	});

	it('hydrate from props skips global overwrite decision', () => {
		writeExplorerLastPathLocalBuffer('home://global-last/');
		const fromProps = readExplorerWindowDocumentPath({
			documentPath: 'home://restored-folder/',
		});
		expect(
			shouldHydrateExplorerGlobalLastPath({
				windowDocumentPath: fromProps,
			}),
		).toBe(false);
		expect(fromProps).toBe('home://restored-folder/');
		// Global buffer untouched by hydrate decision itself
		expect(readExplorerLastPathLocalBuffer()).toBe('home://global-last/');
	});
});
