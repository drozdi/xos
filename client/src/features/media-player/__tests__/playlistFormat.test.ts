import { describe, expect, it } from 'vitest';

import {
	defaultPlaylistName,
	isPlaylistFile,
	parsePlaylistFile,
	serializePlaylistFile,
} from '../playlistFormat';

describe('playlistFormat', () => {
	it('detects playlist files by extension', () => {
		expect(isPlaylistFile('home://Music/list.xos-playlist')).toBe(true);
		expect(isPlaylistFile('home://Music/song.mp3')).toBe(false);
	});

	it('parses and serializes playlist JSON', () => {
		const playlist = {
			version: 1 as const,
			kind: 'audio' as const,
			name: 'Test',
			items: ['home://Music/a.mp3', 'home://Music/b.mp3'],
		};
		const serialized = serializePlaylistFile(playlist);
		const parsed = parsePlaylistFile(serialized, 'audio');
		expect(parsed).toEqual(playlist);
	});

	it('rejects wrong kind', () => {
		const content = serializePlaylistFile({
			version: 1,
			kind: 'video',
			name: 'V',
			items: [],
		});
		expect(() => parsePlaylistFile(content, 'audio')).toThrow();
	});

	it('default names differ by kind', () => {
		expect(defaultPlaylistName('audio')).not.toBe(defaultPlaylistName('video'));
	});
});
