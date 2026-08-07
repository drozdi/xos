import { useEffect, useRef, useState } from 'react';

import { getDesktopStatePersister } from '@/core/settings/desktopStatePersister';
import { setWindowDocumentPath } from '@/core/windowManager/persistWindow';

import { resolveExplorerLastPath, writeExplorerLastPathLocalBuffer } from '../explorerLastPath';
import { normalizeExplorerFolderPath } from '../explorerPathUtils';
import { useExplorerPickerStore } from '../explorerPickerStore';

export type UseExplorerLastPathOptions = {
	windowId: string;
	currentPath: string;
	navigate: (path: string) => void;
	/** When false, skip WIN + global persist (picker apps). */
	persistEnabled?: boolean;
	/**
	 * When true, load global `explorer.last_path` once on mount.
	 * Only for *new* explorer windows without `WIN.documentPath` / props.
	 */
	hydrateGlobal?: boolean;
};

/** Read folder path from app props (WIN restore → props.documentPath). */
export function readExplorerWindowDocumentPath(props?: Record<string, unknown>): string | null {
	const value = props?.documentPath;
	if (typeof value !== 'string' || value.length === 0) {
		return null;
	}
	return normalizeExplorerFolderPath(value);
}

/** Global last_path hydrate only when no explicit/WIN path and not a picker. */
export function shouldHydrateExplorerGlobalLastPath(options: {
	initialPath?: string;
	windowDocumentPath?: string | null;
	pickerMode?: boolean | string;
}): boolean {
	return (
		options.initialPath === undefined &&
		!options.windowDocumentPath &&
		!options.pickerMode
	);
}

/**
 * Persist explorer folder path: SoT = WIN.documentPath; global buffer = Start Menu fallback.
 * No-op when `persistEnabled` is false (picker).
 */
export function persistExplorerFolderPath(
	windowId: string,
	folderPath: string,
	persistEnabled: boolean,
): void {
	if (!persistEnabled) {
		return;
	}
	setWindowDocumentPath(windowId, folderPath);
	writeExplorerLastPathLocalBuffer(folderPath);
	getDesktopStatePersister().schedule();
}

/**
 * Per-window folder path via WIN.documentPath; optional global last_path hydrate for new windows.
 */
export function useExplorerLastPath({
	windowId,
	currentPath,
	navigate,
	persistEnabled = true,
	hydrateGlobal = true,
}: UseExplorerLastPathOptions): void {
	const [hydrated, setHydrated] = useState(!hydrateGlobal);
	const navigateRef = useRef(navigate);
	navigateRef.current = navigate;
	const mountPathRef = useRef(currentPath);
	const currentPathRef = useRef(currentPath);
	currentPathRef.current = currentPath;

	useEffect(() => {
		if (!hydrateGlobal) {
			setHydrated(true);
			return;
		}

		let cancelled = false;

		void (async () => {
			const path = await resolveExplorerLastPath();
			if (cancelled) {
				return;
			}
			const stillAtMount = currentPathRef.current === mountPathRef.current;
			const pickerActive = Boolean(useExplorerPickerStore.getState().active);
			if (stillAtMount && !pickerActive && path !== mountPathRef.current) {
				navigateRef.current(path);
			}
			setHydrated(true);
		})();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
	}, [hydrateGlobal]);

	useEffect(() => {
		if (!persistEnabled || !hydrated) {
			return;
		}
		persistExplorerFolderPath(windowId, currentPath, true);
	}, [currentPath, persistEnabled, hydrated, windowId]);
}
