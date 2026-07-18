import { useEffect, useRef } from 'react';

import { useExplorerPickerStore } from './explorerPickerStore';

export function useExplorerPickerResult(consumerAppId: string, onPick: (path: string) => void) {
	const onPickRef = useRef(onPick);
	onPickRef.current = onPick;
	const takeResult = useExplorerPickerStore((state) => state.takeResult);

	useEffect(() => {
		const initial = takeResult(consumerAppId);
		if (initial) {
			onPickRef.current(initial);
		}
	}, [consumerAppId, takeResult]);

	useEffect(() => {
		return useExplorerPickerStore.subscribe((state, prev) => {
			const nextPath = state.pendingResults[consumerAppId];
			const prevPath = prev.pendingResults[consumerAppId];
			if (nextPath && nextPath !== prevPath) {
				const path = takeResult(consumerAppId);
				if (path) {
					onPickRef.current(path);
				}
			}
		});
	}, [consumerAppId, takeResult]);
}
