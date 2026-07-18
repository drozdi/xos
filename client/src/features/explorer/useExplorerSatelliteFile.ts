import { useCallback, useEffect, useState } from 'react';

import { openExplorerPicker } from './explorerPickerStore';
import { useExplorerOpenFile } from './useExplorerOpenFile';
import { useExplorerPickerResult } from './useExplorerPickerResult';

interface UseExplorerSatelliteFileOptions {
	appId: string;
	fileTypes: string[];
	extensions?: string[];
}

export function useExplorerSatelliteFile({ appId, fileTypes, extensions }: UseExplorerSatelliteFileOptions) {
	const openedPath = useExplorerOpenFile(appId);
	const [currentPath, setCurrentPath] = useState<string | null>(null);

	useEffect(() => {
		if (openedPath) {
			setCurrentPath(openedPath);
		}
	}, [openedPath]);

	useExplorerPickerResult(appId, (path) => {
		setCurrentPath(path);
	});

	const openFile = useCallback(async () => {
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: appId,
			fileTypes,
			extensions,
			initialPath: currentPath ?? undefined,
			title: 'Открыть файл',
		});
	}, [appId, currentPath, extensions, fileTypes]);

	return {
		currentPath,
		setCurrentPath,
		openFile,
	};
}
