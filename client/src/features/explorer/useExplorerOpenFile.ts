import { useEffect, useState } from 'react';

import { apiClient } from '@/core/api/client';
import { useExplorerLaunchStore } from '@/features/explorer/explorerLaunchStore';

export function useExplorerOpenFile(appId: string) {
	const [vfsPath, setVfsPath] = useState<string | null>(null);

	useEffect(() => {
		const applyPending = () => {
			const request = useExplorerLaunchStore.getState().consumeOpenRequest(appId);
			if (request) {
				setVfsPath(request.vfsPath);
			}
		};

		applyPending();

		return useExplorerLaunchStore.subscribe((state, prev) => {
			if (
				state.pending &&
				state.pending !== prev.pending &&
				state.pending.appId === appId
			) {
				applyPending();
			}
		});
	}, [appId]);

	return vfsPath;
}

export async function fetchExplorerText(path: string) {
	const { data } = await apiClient.get<string>(`/api/explorer/content`, {
		params: { path },
		responseType: 'text',
	});
	return typeof data === 'string' ? data : String(data);
}
