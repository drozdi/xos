import { useEffect, useRef } from 'react';

import { useCoreApi } from '@/core/hooks/useCoreApi';

export function useWindowTitle(title: string): void {
	const coreApi = useCoreApi();
	const appliedTitleRef = useRef<string | null>(null);

	useEffect(() => {
		if (appliedTitleRef.current === title) {
			return;
		}
		appliedTitleRef.current = title;
		coreApi.window.setTitle(title);
	}, [coreApi, title]);
}
