import { useEffect, useRef, useState } from 'react';

import { getDesktopStatePersister } from '@/core/settings/desktopStatePersister';

import { resolveExplorerLastPath, writeExplorerLastPathLocalBuffer } from '../explorerLastPath';
import { useExplorerPickerStore } from '../explorerPickerStore';

export type UseExplorerLastPathOptions = {
	currentPath: string;
	navigate: (path: string) => void;
	/** When false, skip persist (e.g. while file picker is active). */
	persistEnabled?: boolean;
	/** When true, load `explorer.last_path` once on mount. */
	hydrate?: boolean;
};

/**
 * Hydrate Explorer from `explorer.last_path` on open; debounce-persist on folder change.
 * Does not touch clipboard store.
 */
export function useExplorerLastPath({
	currentPath,
	navigate,
	persistEnabled = true,
	hydrate = true,
}: UseExplorerLastPathOptions): void {
	const [hydrated, setHydrated] = useState(!hydrate);
	const navigateRef = useRef(navigate);
	navigateRef.current = navigate;
	const mountPathRef = useRef(currentPath);
	const currentPathRef = useRef(currentPath);
	currentPathRef.current = currentPath;

	useEffect(() => {
		if (!hydrate) {
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
	}, [hydrate]);

	useEffect(() => {
		if (!persistEnabled || !hydrated) {
			return;
		}
		writeExplorerLastPathLocalBuffer(currentPath);
		getDesktopStatePersister().schedule();
	}, [currentPath, persistEnabled, hydrated]);
}
