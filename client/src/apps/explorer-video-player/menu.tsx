import { createMediaPlayerMenu } from '@/features/media-player/mediaPlayerMenu';

export default createMediaPlayerMenu({
	kind: 'video',
	appId: 'explorer-video-player',
	fileTypes: ['video'],
	openMediaLabel: 'Открыть видео…',
	openMediaTitle: 'Открыть видеофайл',
});
