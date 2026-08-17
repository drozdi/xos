import { useMediaPlayer, MediaPlayerLayout } from '@/features/media-player';

export default function ExplorerAudioPlayerApp() {
	const { session, mediaUrl } = useMediaPlayer({
		appId: 'explorer-audio-player',
		kind: 'audio',
		fileTypes: ['audio'],
	});

	return (
		<MediaPlayerLayout
			kind="audio"
			session={session}
			mediaUrl={mediaUrl}
			emptyMessage="Откройте аудиофайл или добавьте треки в плейлист"
			mediaElement={<audio src={mediaUrl ?? undefined} controls style={{ width: '100%' }} />}
		/>
	);
}
