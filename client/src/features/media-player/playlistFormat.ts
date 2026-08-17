import { z } from 'zod';

export const PLAYLIST_EXTENSION = 'xos-playlist';

export type MediaPlayerKind = 'audio' | 'video';

const playlistFileSchema = z.object({
	version: z.literal(1),
	kind: z.enum(['audio', 'video']),
	name: z.string().min(1).max(255),
	items: z.array(z.string().min(1)),
});

export type PlaylistFile = z.infer<typeof playlistFileSchema>;

export function isPlaylistFile(path: string): boolean {
	return path.toLowerCase().endsWith(`.${PLAYLIST_EXTENSION}`);
}

export function parsePlaylistFile(content: string, expectedKind?: MediaPlayerKind): PlaylistFile {
	const raw = JSON.parse(content) as unknown;
	const parsed = playlistFileSchema.parse(raw);
	if (expectedKind && parsed.kind !== expectedKind) {
		throw new Error(`Плейлист для ${parsed.kind === 'audio' ? 'аудио' : 'видео'}, а не для ${expectedKind === 'audio' ? 'аудио' : 'видео'}`);
	}
	return parsed;
}

export function serializePlaylistFile(playlist: PlaylistFile): string {
	return `${JSON.stringify(playlist, null, 2)}\n`;
}

export function defaultPlaylistName(kind: MediaPlayerKind): string {
	return kind === 'audio' ? 'Новый плейлист' : 'Новый видеоплейлист';
}

export function playlistNameFromPath(path: string): string {
	const fileName = path.split('/').pop() ?? path;
	return fileName.replace(/\.xos-playlist$/i, '') || fileName;
}
