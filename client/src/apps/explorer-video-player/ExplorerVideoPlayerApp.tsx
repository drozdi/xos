import { useMediaPlayer, MediaPlayerLayout } from '@/features/media-player';

export default function ExplorerVideoPlayerApp() {
	const { session, mediaUrl } = useMediaPlayer({
		appId: 'explorer-video-player',
		kind: 'video',
		fileTypes: ['video'],
	});

	return (
		<MediaPlayerLayout
			kind="video"
			session={session}
			mediaUrl={mediaUrl}
			emptyMessage="Откройте видеофайл или добавьте ролики в плейлист"
			mediaElement={
				<video src={mediaUrl ?? undefined} controls style={{ width: '100%', maxHeight: 360, display: 'block', margin: '0 auto' }} />
			}
		/>
	);
}
