import { Box, Paper, Stack, Text } from '@mantine/core';
import { useRef, useState, type ReactNode, type RefObject } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';

import { AudioTransportBar } from './AudioTransportBar';
import { MediaPlaylistPanel } from './MediaPlaylistPanel';
import { VideoTransportBar } from './VideoTransportBar';
import type { MediaPlayerKind } from './playlistFormat';
import type { MediaPlayerSession } from './mediaPlayerStore';

interface MediaPlayerLayoutProps {
	kind: MediaPlayerKind;
	session: MediaPlayerSession;
	mediaUrl: string | null;
	mediaElement: ReactNode;
	emptyMessage: string;
	videoRef?: RefObject<HTMLVideoElement | null>;
	audioRef?: RefObject<HTMLAudioElement | null>;
}

export function MediaPlayerLayout({
	kind,
	session,
	mediaUrl,
	mediaElement,
	emptyMessage,
	videoRef,
	audioRef,
}: MediaPlayerLayoutProps) {
	const titleBase = session.playlistName;
	const trackName = session.currentPath ? getExplorerFileName(session.currentPath) : null;
	const windowTitle = session.dirty ? `${titleBase} *` : titleBase;
	useWindowTitle(trackName ? `${trackName} — ${windowTitle}` : windowTitle);
	const [playlistOpen, setPlaylistOpen] = useState(true);
	const playerRef = useRef<HTMLDivElement>(null);

	if (kind === 'audio' && audioRef) {
		return (
			<Stack h="100%" gap={0} style={{ minHeight: 0, position: 'relative', background: 'var(--xos-shell-bg)' }}>
				<Box style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>{mediaElement}</Box>
				<AudioTransportBar audioRef={audioRef} mediaUrl={mediaUrl} />
				<Box style={{ flex: 1, minHeight: 0 }}>
					<MediaPlaylistPanel kind={kind} variant="list" />
				</Box>
			</Stack>
		);
	}

	if (kind === 'video' && videoRef) {
		return (
			<Stack ref={playerRef} h="100%" gap={0} style={{ minHeight: 0, background: 'var(--xos-shell-bg)' }}>
				<Box style={{ flex: 1, minHeight: 0, display: 'flex' }}>
					<Box style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', background: '#111' }}>
						{mediaUrl ? (
							<Box style={{ position: 'absolute', inset: 0 }}>{mediaElement}</Box>
						) : (
							<Box style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Text c="dimmed" ta="center" px="md">
									{emptyMessage}
								</Text>
							</Box>
						)}
					</Box>
					{playlistOpen ? (
						<Box w={280} style={{ flexShrink: 0, minHeight: 0, borderLeft: '1px solid var(--xos-shell-border)' }}>
							<MediaPlaylistPanel kind={kind} variant="sidebar" />
						</Box>
					) : null}
				</Box>
				<VideoTransportBar
					videoRef={videoRef}
					fullscreenTargetRef={playerRef}
					mediaUrl={mediaUrl}
					playlistOpen={playlistOpen}
					onTogglePlaylist={() => setPlaylistOpen((open) => !open)}
				/>
			</Stack>
		);
	}

	return (
		<Stack h="100%" gap={0} style={{ minHeight: 0 }}>
			<Paper
				radius={0}
				p="md"
				style={{
					borderBottom: '1px solid var(--mantine-color-default-border)',
					background:
						kind === 'audio'
							? 'linear-gradient(135deg, var(--mantine-color-indigo-light) 0%, var(--mantine-color-violet-light) 100%)'
							: 'var(--mantine-color-default-hover)',
				}}
			>
				{mediaUrl ? (
					mediaElement
				) : (
					<Text c="dimmed" ta="center" py={kind === 'audio' ? 'md' : 'xl'}>
						{emptyMessage}
					</Text>
				)}
			</Paper>
			<Box p="md" style={{ flex: 1, minHeight: 0 }}>
				<MediaPlaylistPanel kind={kind} />
			</Box>
		</Stack>
	);
}
