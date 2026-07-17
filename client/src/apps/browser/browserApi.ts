import { apiClient } from '@/core/api/client';
import { extractApiErrorMessage } from '@/core/api/apiError';

export async function fetchBrowserPage(url: string): Promise<string> {
	try {
		const { data } = await apiClient.get<string>('/api/browser/proxy', {
			params: { url },
			responseType: 'text',
			transformResponse: [(response) => response],
			headers: { Accept: 'text/html' },
		});

		return typeof data === 'string' ? data : String(data);
	} catch (error) {
		throw new Error(extractApiErrorMessage(error, 'Не удалось загрузить страницу'));
	}
}
