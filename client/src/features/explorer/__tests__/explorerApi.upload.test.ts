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

import { uploadExplorerFile } from '@/features/explorer/explorerApi';

describe('explorerApi FormData uploads', () => {
	beforeEach(() => {
		post.mockReset();
	});

	it('uploadExplorerFile posts FormData without forcing Content-Type', async () => {
		post.mockResolvedValue({
			data: {
				name: 'a.txt',
				relativePath: 'a.txt',
				type: 'file',
				fileType: 'text',
				size: 1,
				modifiedAt: '2026-09-15T00:00:00Z',
				permissions: ['read', 'write'],
			},
		});

		await uploadExplorerFile('home://Docs/a.txt', new File(['a'], 'a.txt', { type: 'text/plain' }));

		expect(post).toHaveBeenCalledTimes(1);
		const [url, body, config] = post.mock.calls[0]!;
		expect(url).toBe('/api/explorer/upload');
		expect(body).toBeInstanceOf(FormData);
		expect(config).toBeUndefined();
		expect((body as FormData).get('path')).toBe('home://Docs/a.txt');
		expect((body as FormData).get('file')).toBeInstanceOf(File);
	});
});
