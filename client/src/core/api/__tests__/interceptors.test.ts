import { AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { stripJsonContentTypeForFormData } from '@/core/api/interceptors';

describe('stripJsonContentTypeForFormData', () => {
	it('removes JSON Content-Type so FormData is sent as multipart', () => {
		const formData = new FormData();
		formData.append('files[]', new Blob(['hello'], { type: 'text/plain' }), 'note.txt');

		const config = stripJsonContentTypeForFormData({
			headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
			data: formData,
		});

		expect(config.headers.get('Content-Type')).toBeUndefined();
	});

	it('keeps JSON Content-Type for plain objects', () => {
		const config = stripJsonContentTypeForFormData({
			headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
			data: { path: '/tmp' },
		});

		expect(config.headers.get('Content-Type')).toBe('application/json');
	});
});
