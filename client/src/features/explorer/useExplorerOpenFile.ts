import { useEffect, useState } from 'react';

import { apiClient } from '@/core/api/client';
import { useExplorerLaunchStore } from '@/features/explorer/explorerLaunchStore';

export function useExplorerOpenFile(appId: string) {
	const [vfsPath, setVfsPath] = useState<string | null>(null);
	const consumeOpenRequest = useExplorerLaunchStore((state) => state.consumeOpenRequest);

	useEffect(() => {
		const request = consumeOpenRequest(appId);
		if (request) {
			setVfsPath(request.vfsPath);
		}
	}, [appId, consumeOpenRequest]);

	return vfsPath;
}

export async function fetchExplorerText(path: string) {
	const { data } = await apiClient.get<string>(`/api/explorer/content`, {
		params: { path },
		responseType: 'text',
	});
	return typeof data === 'string' ? data : String(data);
}
