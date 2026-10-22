import { useEffect, useRef } from 'react';

import { useMediaPlayer, MediaPlayerLayout } from '@/features/media-player';

export default function ExplorerVideoPlayerApp() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const { session, mediaUrl } = useMediaPlayer({
		appId: 'explorer-video-player',
		kind: 'video',
		fileTypes: ['video'],
	});

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !mediaUrl) {
			return;
		}
		void video.play().catch(() => undefined);
	}, [mediaUrl]);

	return (
		<MediaPlayerLayout
			kind="video"
			session={session}
			mediaUrl={mediaUrl}
			videoRef={videoRef}
			emptyMessage="Откройте видеофайл или добавьте ролики в плейлист"
			mediaElement={
				<video
					ref={videoRef}
					src={mediaUrl ?? undefined}
					style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }}
				/>
			}
		/>
	);
}
