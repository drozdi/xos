import { ActionIcon, Group, Slider, Stack, Text } from '@mantine/core';
import {
	IconPlayerPause,
	IconPlayerPlay,
	IconPlayerSkipBack,
	IconPlayerSkipForward,
	IconPlayerStop,
	IconVolume,
	IconVolumeOff,
} from '@tabler/icons-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { useAppContext } from '@/core/context/AppContext';

import { useMediaPlayerStore } from './mediaPlayerStore';

interface AudioTransportBarProps {
	audioRef: RefObject<HTMLAudioElement | null>;
	mediaUrl: string | null;
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

export function AudioTransportBar({ audioRef, mediaUrl }: AudioTransportBarProps) {
	const { windowId } = useAppContext();
	const session = useMediaPlayerStore((state) => state.getSession(windowId, 'audio'));
	const setCurrentPath = useMediaPlayerStore((state) => state.setCurrentPath);
	const scrubbing = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [current, setCurrent] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [muted, setMuted] = useState(false);

	const currentIndex = session.currentPath ? session.items.indexOf(session.currentPath) : -1;

	const step = (delta: number) => {
		const next = session.items[currentIndex + delta];
		if (next) {
			setCurrentPath(windowId, next);
		}
	};

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) {
			return undefined;
		}

		const syncTime = () => {
			if (!scrubbing.current) {
				setCurrent(audio.currentTime);
			}
		};
		const syncDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
		const syncPlay = () => setPlaying(!audio.paused);
		const syncVolume = () => {
			setVolume(audio.volume);
			setMuted(audio.muted);
		};
		const onEnded = () => {
			const latest = useMediaPlayerStore.getState().getSession(windowId, 'audio');
			const index = latest.currentPath ? latest.items.indexOf(latest.currentPath) : -1;
			const next = latest.items[index + 1];
			if (next) {
				useMediaPlayerStore.getState().setCurrentPath(windowId, next);
			}
		};

		syncDuration();
		syncPlay();
		syncVolume();
		audio.addEventListener('timeupdate', syncTime);
		audio.addEventListener('durationchange', syncDuration);
		audio.addEventListener('loadedmetadata', syncDuration);
		audio.addEventListener('play', syncPlay);
		audio.addEventListener('pause', syncPlay);
		audio.addEventListener('volumechange', syncVolume);
		audio.addEventListener('ended', onEnded);
		return () => {
			audio.removeEventListener('timeupdate', syncTime);
			audio.removeEventListener('durationchange', syncDuration);
			audio.removeEventListener('loadedmetadata', syncDuration);
			audio.removeEventListener('play', syncPlay);
			audio.removeEventListener('pause', syncPlay);
			audio.removeEventListener('volumechange', syncVolume);
			audio.removeEventListener('ended', onEnded);
		};
	}, [audioRef, mediaUrl, windowId]);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio || !mediaUrl) {
			return;
		}
		if (audio.paused) {
			void audio.play();
		} else {
			audio.pause();
		}
	};

	const stop = () => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		audio.pause();
		audio.currentTime = 0;
	};

	return (
		<Stack gap={4} px="xs" py={6} style={{ background: 'var(--xos-shell-bg)', borderBottom: '1px solid var(--xos-shell-border)', flexShrink: 0 }}>
			<Group gap={6} wrap="nowrap">
				<Text
					ff="monospace"
					fw={700}
					c="dimmed"
					style={{ fontVariantNumeric: 'tabular-nums' }}
				>
					{formatTime(current)}
				</Text>
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
						const audio = audioRef.current;
						if (audio) {
							audio.currentTime = value;
						}
						scrubbing.current = false;
						setCurrent(value);
					}}
				/>
			</Group>
			<Group gap={4} wrap="nowrap" justify="space-between">
				<Group gap={2} wrap="nowrap">
					<ActionIcon variant="subtle" color="gray" size="sm" aria-label="Предыдущий" disabled={currentIndex <= 0} onClick={() => step(-1)}>
						<IconPlayerSkipBack size={16} />
					</ActionIcon>
					<ActionIcon variant={playing ? 'subtle' : 'light'} color="gray" size="sm" aria-label="Воспроизвести" disabled={!mediaUrl || playing} onClick={togglePlay}>
						<IconPlayerPlay size={16} />
					</ActionIcon>
					<ActionIcon variant={playing ? 'light' : 'subtle'} color="gray" size="sm" aria-label="Пауза" disabled={!mediaUrl || !playing} onClick={togglePlay}>
						<IconPlayerPause size={16} />
					</ActionIcon>
					<ActionIcon variant="subtle" color="gray" size="sm" aria-label="Стоп" disabled={!mediaUrl} onClick={stop}>
						<IconPlayerStop size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="gray"
						size="sm"
						aria-label="Следующий"
						disabled={currentIndex < 0 || currentIndex >= session.items.length - 1}
						onClick={() => step(1)}
					>
						<IconPlayerSkipForward size={16} />
					</ActionIcon>
				</Group>
				<Group gap={4} wrap="nowrap">
					<ActionIcon
						variant="subtle"
						color="gray"
						aria-label={muted || volume === 0 ? 'Включить звук' : 'Выключить звук'}
						onClick={() => {
							const audio = audioRef.current;
							if (!audio) {
								return;
							}
							audio.muted = !audio.muted;
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
						label={(value) => `${Math.round(value * 100)}%`}
						onChange={(value) => {
							const audio = audioRef.current;
							if (!audio) {
								return;
							}
							audio.muted = false;
							audio.volume = value;
						}}
					/>
				</Group>
			</Group>
		</Stack>
	);
}
