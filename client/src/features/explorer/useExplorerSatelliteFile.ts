import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { setWindowDocumentPath } from '@/core/windowManager/persistWindow';

import { openExplorerPicker } from './explorerPickerStore';
import { useExplorerOpenFile } from './useExplorerOpenFile';
import { useExplorerPickerResult } from './useExplorerPickerResult';

interface UseExplorerSatelliteFileOptions {
	appId: string;
	fileTypes: string[];
	extensions?: string[];
}

/** Survives window remount (maximize / Rnd key change). */
const pathByWindowId = new Map<string, string>();

/** Open-picker consumer scoped to a window (avoids sibling steal). */
export function explorerOpenPickerConsumerId(appId: string, windowId: string): string {
	return `${appId}:open:${windowId}`;
}

function readPropsDocumentPath(props?: Record<string, unknown>): string | null {
	const value = props?.documentPath;
	return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Legacy path-keyed multi-instance: `appId-${vfsPath}` (uuid keys are ignored). */
function pathFromInstanceKey(appId: string, instanceKey: string): string | null {
	const prefix = `${appId}-`;
	if (!instanceKey.startsWith(prefix)) {
		return null;
	}
	const rest = instanceKey.slice(prefix.length);
	if (!rest || (!rest.includes('://') && !rest.includes('/'))) {
		return null;
	}
	return rest;
}

function resolveInitialPath(
	windowId: string,
	appId: string,
	instanceKey: string,
	props?: Record<string, unknown>,
): string | null {
	const cached = pathByWindowId.get(windowId);
	if (cached) {
		return cached;
	}
	return readPropsDocumentPath(props) ?? pathFromInstanceKey(appId, instanceKey);
}

export function useExplorerSatelliteFile({ appId, fileTypes, extensions }: UseExplorerSatelliteFileOptions) {
	const { windowId, instanceKey, props } = useAppContext();
	const openedPath = useExplorerOpenFile(appId);
	const openConsumerId = explorerOpenPickerConsumerId(appId, windowId);
	const [currentPath, setCurrentPathState] = useState<string | null>(() => {
		const initial = resolveInitialPath(windowId, appId, instanceKey, props);
		if (initial) {
			pathByWindowId.set(windowId, initial);
		}
		return initial;
	});

	const setCurrentPath = useCallback(
		(path: string | null) => {
			if (path) {
				pathByWindowId.set(windowId, path);
			} else {
				pathByWindowId.delete(windowId);
			}
			setWindowDocumentPath(windowId, path);
			setCurrentPathState(path);
		},
		[windowId],
	);

	useEffect(() => {
		const cached = pathByWindowId.get(windowId) ?? null;
		if (cached && cached !== currentPath) {
			setCurrentPathState(cached);
		}
	}, [windowId, currentPath]);

	/** Keep WIN.documentPath in sync when hydrated from props / instanceKey (not only setCurrentPath). */
	useEffect(() => {
		if (currentPath) {
			setWindowDocumentPath(windowId, currentPath);
		}
	}, [windowId, currentPath]);

	useEffect(() => {
		if (openedPath) {
			setCurrentPath(openedPath);
		}
	}, [openedPath, setCurrentPath]);

	useExplorerPickerResult(openConsumerId, (path) => {
		setCurrentPath(path);
	});

	const openFile = useCallback(async () => {
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: openConsumerId,
			fileTypes,
			extensions,
			initialPath: currentPath ?? pathByWindowId.get(windowId) ?? undefined,
			title: 'Открыть файл',
		});
	}, [openConsumerId, currentPath, extensions, fileTypes, windowId]);

	return {
		currentPath,
		setCurrentPath,
		openFile,
	};
}

/** Test helper */
export function clearExplorerSatellitePathCache(): void {
	pathByWindowId.clear();
}
