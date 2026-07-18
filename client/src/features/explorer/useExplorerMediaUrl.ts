import { useEffect, useState } from 'react';

import { apiClient } from '@/core/api/client';

export function useExplorerMediaUrl(path: string | null) {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!path) {
			setUrl(null);
			return;
		}

		let objectUrl: string | null = null;
		let cancelled = false;

		void apiClient
			.get<Blob>('/api/explorer/content', { params: { path }, responseType: 'blob' })
			.then((response) => {
				if (cancelled) {
					return;
				}
				objectUrl = URL.createObjectURL(response.data);
				setUrl(objectUrl);
			})
			.catch(() => setUrl(null));

		return () => {
			cancelled = true;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [path]);

	return url;
}

export { useExplorerOpenFile, fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
