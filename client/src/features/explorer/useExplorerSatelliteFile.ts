import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';

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

export function useExplorerSatelliteFile({ appId, fileTypes, extensions }: UseExplorerSatelliteFileOptions) {
	const { windowId } = useAppContext();
	const openedPath = useExplorerOpenFile(appId);
	const [currentPath, setCurrentPathState] = useState<string | null>(
		() => pathByWindowId.get(windowId) ?? null,
	);

	const setCurrentPath = useCallback(
		(path: string | null) => {
			if (path) {
				pathByWindowId.set(windowId, path);
			} else {
				pathByWindowId.delete(windowId);
			}
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

	useEffect(() => {
		if (openedPath) {
			setCurrentPath(openedPath);
		}
	}, [openedPath, setCurrentPath]);

	useExplorerPickerResult(appId, (path) => {
		setCurrentPath(path);
	});

	const openFile = useCallback(async () => {
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: appId,
			fileTypes,
			extensions,
			initialPath: currentPath ?? pathByWindowId.get(windowId) ?? undefined,
			title: 'Открыть файл',
		});
	}, [appId, currentPath, extensions, fileTypes, windowId]);

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
