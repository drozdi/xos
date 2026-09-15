import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();

vi.mock('@/core/api/client', () => ({
	apiClient: {
		post: (...args: unknown[]) => post(...args),
		get: vi.fn(),
		put: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

import { pkbApi } from '@/core/api/endpoints/pkbApi';

describe('pkbApi FormData uploads', () => {
	beforeEach(() => {
		post.mockReset();
	});

	it('uploadFile posts FormData without forcing Content-Type', async () => {
		post.mockResolvedValue({
			data: {
				name: 'a.txt',
				path: 'Notes/a.txt',
				type: 'file',
				extension: 'txt',
			},
		});

		await pkbApi.uploadFile(7, 'Notes', new File(['a'], 'a.txt', { type: 'text/plain' }));

		expect(post).toHaveBeenCalledTimes(1);
		const [url, body, config] = post.mock.calls[0]!;
		expect(url).toBe('/api/pkb/vaults/7/files/upload');
		expect(body).toBeInstanceOf(FormData);
		expect(config).toBeUndefined();
		expect((body as FormData).get('path')).toBe('Notes');
		expect((body as FormData).get('file')).toBeInstanceOf(File);
	});
});
