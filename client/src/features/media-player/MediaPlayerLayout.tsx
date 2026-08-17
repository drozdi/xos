import { Box, Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';

import { MediaPlaylistPanel } from './MediaPlaylistPanel';
import type { MediaPlayerKind } from './playlistFormat';
import type { MediaPlayerSession } from './mediaPlayerStore';

interface MediaPlayerLayoutProps {
	kind: MediaPlayerKind;
	session: MediaPlayerSession;
	mediaUrl: string | null;
	mediaElement: ReactNode;
	emptyMessage: string;
}

export function MediaPlayerLayout({ kind, session, mediaUrl, mediaElement, emptyMessage }: MediaPlayerLayoutProps) {
	const titleBase = session.playlistName;
	const trackName = session.currentPath ? getExplorerFileName(session.currentPath) : null;
	const windowTitle = session.dirty ? `${titleBase} *` : titleBase;
	useWindowTitle(trackName ? `${trackName} — ${windowTitle}` : windowTitle);

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
