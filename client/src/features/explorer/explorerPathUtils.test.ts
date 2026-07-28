import { describe, expect, it } from 'vitest';

import { joinExplorerDiskPath, normalizeExplorerFolderPath, parseExplorerDisk } from './explorerPathUtils';

describe('explorerPathUtils', () => {
	it('parses disk from uri', () => {
		expect(parseExplorerDisk('home://docs/')).toBe('home');
		expect(parseExplorerDisk('IMG://')).toBe('img');
	});

	it('joins disk root and relative without breaking ://', () => {
		expect(joinExplorerDiskPath('home://', 'docs')).toBe('home://docs/');
		expect(joinExplorerDiskPath('home://', 'docs/sub')).toBe('home://docs/sub/');
		expect(joinExplorerDiskPath('home://', '')).toBe('home://');
		expect(joinExplorerDiskPath('home://', '/')).toBe('home://');
	});

	it('normalizes folder paths', () => {
		expect(normalizeExplorerFolderPath('home://')).toBe('home://');
		expect(normalizeExplorerFolderPath('home://docs')).toBe('home://docs/');
		expect(normalizeExplorerFolderPath('home://docs/')).toBe('home://docs/');
	});
});
