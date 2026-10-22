import { useEffect, useRef } from 'react';

import { useMediaPlayer, MediaPlayerLayout } from '@/features/media-player';

export default function ExplorerAudioPlayerApp() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { session, mediaUrl } = useMediaPlayer({
		appId: 'explorer-audio-player',
		kind: 'audio',
		fileTypes: ['audio'],
	});

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio || !mediaUrl) {
			return;
		}
		void audio.play().catch(() => undefined);
	}, [mediaUrl]);

	return (
		<MediaPlayerLayout
			kind="audio"
			session={session}
			mediaUrl={mediaUrl}
			audioRef={audioRef}
			emptyMessage="Откройте аудиофайл или добавьте треки в плейлист"
			mediaElement={<audio ref={audioRef} src={mediaUrl ?? undefined} />}
		/>
	);
}
