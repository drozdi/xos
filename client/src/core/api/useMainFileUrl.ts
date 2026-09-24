import { useEffect, useState } from 'react';

import { apiClient } from '@/core/api/client';

const blobUrlCache = new Map<number, string>();
const inflight = new Map<number, Promise<string>>();

async function loadMainFileBlobUrl(fileId: number): Promise<string> {
	const cached = blobUrlCache.get(fileId);
	if (cached) return cached;

	const pending = inflight.get(fileId);
	if (pending) return pending;

	const request = apiClient
		.get<Blob>(`/api/main/file/${fileId}`, { responseType: 'blob' })
		.then(({ data }) => {
			const url = URL.createObjectURL(data);
			blobUrlCache.set(fileId, url);
			inflight.delete(fileId);
			return url;
		})
		.catch((error) => {
			inflight.delete(fileId);
			throw error;
		});

	inflight.set(fileId, request);
	return request;
}

/** Blob URL for main_file via JWT API (plain /uploads is 401 in <img>). */
export function useMainFileUrl(fileId: number | null | undefined): string | null {
	const [url, setUrl] = useState<string | null>(() =>
		fileId != null && fileId > 0 ? (blobUrlCache.get(fileId) ?? null) : null,
	);

	useEffect(() => {
		if (fileId == null || fileId <= 0) {
			setUrl(null);
			return;
		}
		const cached = blobUrlCache.get(fileId);
		if (cached) {
			setUrl(cached);
			return;
		}
		let cancelled = false;
		void loadMainFileBlobUrl(fileId)
			.then((next) => {
				if (!cancelled) setUrl(next);
			})
			.catch(() => {
				if (!cancelled) setUrl(null);
			});
		return () => {
			cancelled = true;
		};
	}, [fileId]);

	return url;
}
