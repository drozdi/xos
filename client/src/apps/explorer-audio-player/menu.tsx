import { createMediaPlayerMenu } from '@/features/media-player/mediaPlayerMenu';

export default createMediaPlayerMenu({
	kind: 'audio',
	appId: 'explorer-audio-player',
	fileTypes: ['audio'],
	openMediaLabel: 'Открыть аудио…',
	openMediaTitle: 'Открыть аудиофайл',
});
