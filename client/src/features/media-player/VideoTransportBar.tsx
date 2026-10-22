import { ActionIcon, Group, Slider, Text } from '@mantine/core';
import {
	IconList,
	IconMaximize,
	IconMinimize,
	IconPlayerPause,
	IconPlayerPlay,
	IconPlayerSkipBack,
	IconPlayerSkipForward,
	IconVolume,
	IconVolumeOff,
} from '@tabler/icons-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { useAppContext } from '@/core/context/AppContext';

import { useMediaPlayerStore } from './mediaPlayerStore';

interface VideoTransportBarProps {
	videoRef: RefObject<HTMLVideoElement | null>;
	fullscreenTargetRef: RefObject<HTMLElement | null>;
	mediaUrl: string | null;
	playlistOpen: boolean;
	onTogglePlaylist: () => void;
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '0:00';
	}
	const total = Math.floor(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = total % 60;
	const paddedSecs = String(secs).padStart(2, '0');
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
	}
	return `${minutes}:${paddedSecs}`;
}

export function VideoTransportBar({
	videoRef,
	fullscreenTargetRef,
	mediaUrl,
	playlistOpen,
	onTogglePlaylist,
}: VideoTransportBarProps) {
	const { windowId } = useAppContext();
	const session = useMediaPlayerStore((state) => state.getSession(windowId, 'video'));
	const setCurrentPath = useMediaPlayerStore((state) => state.setCurrentPath);
	const scrubbing = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [current, setCurrent] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);

	const currentIndex = session.currentPath ? session.items.indexOf(session.currentPath) : -1;

	const step = (delta: number) => {
		const next = session.items[currentIndex + delta];
		if (next) {
			setCurrentPath(windowId, next);
		}
	};

	useEffect(() => {
		const video = videoRef.current;
		if (!video) {
			return undefined;
		}

		const syncTime = () => {
			if (!scrubbing.current) {
				setCurrent(video.currentTime);
			}
		};
		const syncDuration = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
		const syncPlay = () => setPlaying(!video.paused);
		const syncVolume = () => {
			setVolume(video.volume);
			setMuted(video.muted);
		};
		const onEnded = () => {
			const latest = useMediaPlayerStore.getState().getSession(windowId, 'video');
			const index = latest.currentPath ? latest.items.indexOf(latest.currentPath) : -1;
			const next = latest.items[index + 1];
			if (next) {
				useMediaPlayerStore.getState().setCurrentPath(windowId, next);
			}
		};

		syncDuration();
		syncPlay();
		syncVolume();
		video.addEventListener('timeupdate', syncTime);
		video.addEventListener('durationchange', syncDuration);
		video.addEventListener('loadedmetadata', syncDuration);
		video.addEventListener('play', syncPlay);
		video.addEventListener('pause', syncPlay);
		video.addEventListener('volumechange', syncVolume);
		video.addEventListener('ended', onEnded);
		return () => {
			video.removeEventListener('timeupdate', syncTime);
			video.removeEventListener('durationchange', syncDuration);
			video.removeEventListener('loadedmetadata', syncDuration);
			video.removeEventListener('play', syncPlay);
			video.removeEventListener('pause', syncPlay);
			video.removeEventListener('volumechange', syncVolume);
			video.removeEventListener('ended', onEnded);
		};
	}, [mediaUrl, videoRef, windowId]);

	useEffect(() => {
		const onChange = () => {
			setFullscreen(document.fullscreenElement === fullscreenTargetRef.current);
		};
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, [fullscreenTargetRef]);

	const toggleFullscreen = () => {
		const target = fullscreenTargetRef.current;
		if (!target) {
			return;
		}
		if (document.fullscreenElement === target) {
			void document.exitFullscreen();
			return;
		}
		void target.requestFullscreen();
	};

	const togglePlay = () => {
		const video = videoRef.current;
		if (!video || !mediaUrl) {
			return;
		}
		if (video.paused) {
			void video.play();
		} else {
			video.pause();
		}
	};

	return (
		<Group
			gap="xs"
			wrap="nowrap"
			px="sm"
			py={6}
			style={{ borderTop: '1px solid var(--xos-shell-border)', background: 'var(--xos-shell-bg)', flexShrink: 0 }}
		>
			<ActionIcon variant="subtle" color="gray" aria-label="Предыдущий" disabled={currentIndex <= 0} onClick={() => step(-1)}>
				<IconPlayerSkipBack size={16} />
			</ActionIcon>
			<ActionIcon variant={playing ? 'light' : 'subtle'} color="gray" radius="xl" aria-label={playing ? 'Пауза' : 'Воспроизвести'} disabled={!mediaUrl} onClick={togglePlay}>
				{playing ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
			</ActionIcon>
			<ActionIcon
				variant="subtle"
				color="gray"
				aria-label="Следующий"
				disabled={currentIndex < 0 || currentIndex >= session.items.length - 1}
				onClick={() => step(1)}
			>
				<IconPlayerSkipForward size={16} />
			</ActionIcon>
			<ActionIcon
				variant="subtle"
				color="gray"
				aria-label={muted || volume === 0 ? 'Включить звук' : 'Выключить звук'}
				onClick={() => {
					const video = videoRef.current;
					if (!video) {
						return;
					}
					video.muted = !video.muted;
				}}
			>
				{muted || volume === 0 ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
			</ActionIcon>
			<Slider
				aria-label="Громкость"
				value={muted ? 0 : volume}
				min={0}
				max={1}
				step={0.01}
				w={72}
				size="xs"
				onChange={(value) => {
					const video = videoRef.current;
					if (!video) {
						return;
					}
					video.muted = false;
					video.volume = value;
				}}
			/>
			<Slider
				aria-label="Позиция"
				value={duration > 0 ? current : 0}
				min={0}
				max={duration > 0 ? duration : 1}
				step={0.1}
				style={{ flex: 1 }}
				size="xs"
				disabled={!mediaUrl || duration <= 0}
				onChange={(value) => {
					scrubbing.current = true;
					setCurrent(value);
				}}
				onChangeEnd={(value) => {
					const video = videoRef.current;
					if (video) {
						video.currentTime = value;
					}
					scrubbing.current = false;
					setCurrent(value);
				}}
			/>
			<Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
				{formatTime(current)} / {formatTime(duration)}
			</Text>
			<ActionIcon
				variant={playlistOpen ? 'light' : 'subtle'}
				color="gray"
				aria-label={playlistOpen ? 'Скрыть плейлист' : 'Показать плейлист'}
				aria-pressed={playlistOpen}
				onClick={onTogglePlaylist}
			>
				<IconList size={16} />
			</ActionIcon>
			<ActionIcon
				variant="subtle"
				color="gray"
				aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
				onClick={toggleFullscreen}
			>
				{fullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
			</ActionIcon>
		</Group>
	);
}
