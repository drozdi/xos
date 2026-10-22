import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import {
	IconChevronDown,
	IconChevronUp,
	IconMusic,
	IconPlayerPlay,
	IconPlaylistAdd,
	IconTrash,
	IconVideo,
	IconX,
} from '@tabler/icons-react';

import { useAppContext } from '@/core/context/AppContext';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';

import { useMediaPlayerStore } from './mediaPlayerStore';
import type { MediaPlayerKind } from './playlistFormat';

interface MediaPlaylistPanelProps {
	kind: MediaPlayerKind;
	variant?: 'panel' | 'sidebar' | 'list';
}

export function MediaPlaylistPanel({ kind, variant = 'panel' }: MediaPlaylistPanelProps) {
	const { windowId } = useAppContext();
	const session = useMediaPlayerStore((state) => state.getSession(windowId, kind));
	const patchSession = useMediaPlayerStore((state) => state.patchSession);
	const setCurrentPath = useMediaPlayerStore((state) => state.setCurrentPath);
	const removeItem = useMediaPlayerStore((state) => state.removeItem);
	const moveItem = useMediaPlayerStore((state) => state.moveItem);
	const requestAddFiles = useMediaPlayerStore((state) => state.requestAddFiles);
	const requestNewPlaylist = useMediaPlayerStore((state) => state.requestNewPlaylist);

	const MediaIcon = kind === 'audio' ? IconMusic : IconVideo;

	if (variant === 'list') {
		return (
			<Box
				h="100%"
				style={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: 0,
					background: 'var(--xos-shell-bg)',
				}}
			>
				<ScrollArea style={{ flex: 1 }} type="auto">
					<Stack gap={0}>
						{session.items.length === 0 ? (
							<Text size="xs" c="dimmed" ta="center" py="md" px="sm">
								Плейлист пуст
							</Text>
						) : (
							session.items.map((item, index) => {
								const active = item === session.currentPath;
								return (
									<Group
										key={item}
										gap={6}
										wrap="nowrap"
										px={6}
										py={2}
										style={{
											cursor: 'pointer',
											background: active ? 'var(--xos-shell-hover)' : 'transparent',
										}}
										onClick={() => setCurrentPath(windowId, item)}
									>
										<Text size="xs" style={{ flex: 1 }} truncate title={item}>
											{index + 1}. {getExplorerFileName(item)}
										</Text>
										<ActionIcon
											size="xs"
											variant="subtle"
											color="gray"
											aria-label={`Удалить ${getExplorerFileName(item)} из плейлиста`}
											onClick={(event) => {
												event.stopPropagation();
												removeItem(windowId, item);
											}}
										>
											<IconX size={12} />
										</ActionIcon>
									</Group>
								);
							})
						)}
					</Stack>
				</ScrollArea>
				<Group gap={4} justify="flex-end" px={4} py={4} style={{ borderTop: '1px solid var(--xos-shell-border)' }}>
					<Tooltip label="Добавить">
						<ActionIcon
							variant="subtle"
							color="gray"
							size="sm"
							aria-label="Добавить в плейлист"
							onClick={() => requestAddFiles(windowId)}
						>
							<IconPlaylistAdd size={14} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Box>
		);
	}

	if (variant === 'sidebar') {
		return (
			<Box
				h="100%"
				style={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: 0,
					background: 'var(--xos-shell-bg)',
				}}
			>
				<ScrollArea style={{ flex: 1 }} type="auto">
					<Stack gap={0} py={4}>
						{session.items.length === 0 ? (
							<Text size="sm" c="dimmed" ta="center" py="md" px="sm">
								Плейлист пуст
							</Text>
						) : (
							session.items.map((item) => {
								const active = item === session.currentPath;
								return (
									<Group
										key={item}
										gap={4}
										wrap="nowrap"
										px="sm"
										py={4}
										style={{
											cursor: 'pointer',
											background: active ? 'var(--xos-shell-hover)' : 'transparent',
										}}
										onClick={() => setCurrentPath(windowId, item)}
									>
										<Text size="sm" truncate title={item} style={{ flex: 1 }}>
											{getExplorerFileName(item)}
										</Text>
										<ActionIcon
											size="sm"
											variant="subtle"
											color="gray"
											aria-label={`Удалить ${getExplorerFileName(item)} из плейлиста`}
											onClick={(event) => {
												event.stopPropagation();
												removeItem(windowId, item);
											}}
										>
											<IconX size={14} />
										</ActionIcon>
									</Group>
								);
							})
						)}
					</Stack>
				</ScrollArea>
				<Group gap={4} justify="flex-end" px="xs" py={6} style={{ borderTop: '1px solid var(--xos-shell-border)' }}>
					<Tooltip label="Добавить">
						<ActionIcon
							variant="subtle"
							color="gray"
							aria-label="Добавить в плейлист"
							onClick={() => requestAddFiles(windowId)}
						>
							<IconPlaylistAdd size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Box>
		);
	}

	return (
		<Paper withBorder radius="md" p="sm" h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			<Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
				<Group justify="space-between" align="flex-start" wrap="nowrap">
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Group gap="xs">
							<Text fw={600} size="sm">
								Плейлист
							</Text>
							<Badge variant="light" size="sm">
								{session.items.length}
							</Badge>
							{session.dirty ? (
								<Badge color="orange" variant="light" size="sm">
									*
								</Badge>
							) : null}
						</Group>
						<TextInput
							size="xs"
							value={session.playlistName}
							onChange={(event) =>
								patchSession(windowId, {
									playlistName: event.currentTarget.value,
									dirty: true,
								})
							}
							placeholder="Название плейлиста"
						/>
					</Stack>
				</Group>

				<Group gap={6} wrap="wrap">
					<Button size="compact-xs" variant="light" leftSection={<IconPlaylistAdd size={14} />} onClick={() => requestAddFiles(windowId)}>
						Добавить
					</Button>
					<Button size="compact-xs" variant="subtle" color="gray" onClick={() => requestNewPlaylist(windowId)}>
						Новый
					</Button>
				</Group>

				<ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
					<Stack gap={4}>
						{session.items.length === 0 ? (
							<Text size="sm" c="dimmed" ta="center" py="md">
								Добавьте файлы или откройте плейлист
							</Text>
						) : (
							session.items.map((item, index) => {
								const active = item === session.currentPath;
								return (
									<Box
										key={item}
										p="xs"
										style={{
											borderRadius: 'var(--mantine-radius-sm)',
											background: active ? 'var(--mantine-color-blue-light)' : 'var(--mantine-color-default-hover)',
											border: active
												? '1px solid var(--mantine-color-blue-outline)'
												: '1px solid transparent',
											cursor: 'pointer',
										}}
										onClick={() => setCurrentPath(windowId, item)}
									>
										<Group justify="space-between" wrap="nowrap" gap="xs">
											<Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
												<Text size="xs" c="dimmed" w={20} ta="right">
													{index + 1}
												</Text>
												<MediaIcon size={16} style={{ flexShrink: 0, opacity: 0.7 }} />
												<Text size="sm" truncate title={item}>
													{getExplorerFileName(item)}
												</Text>
											</Group>
											<Group gap={2} wrap="nowrap" onClick={(event) => event.stopPropagation()}>
												<Tooltip label="Вверх">
													<ActionIcon
														size="sm"
														variant="subtle"
														disabled={index === 0}
														onClick={() => moveItem(windowId, item, -1)}
														aria-label="Переместить вверх"
													>
														<IconChevronUp size={14} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Вниз">
													<ActionIcon
														size="sm"
														variant="subtle"
														disabled={index === session.items.length - 1}
														onClick={() => moveItem(windowId, item, 1)}
														aria-label="Переместить вниз"
													>
														<IconChevronDown size={14} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Воспроизвести">
													<ActionIcon
														size="sm"
														variant={active ? 'filled' : 'subtle'}
														onClick={() => setCurrentPath(windowId, item)}
														aria-label="Воспроизвести"
													>
														<IconPlayerPlay size={14} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Удалить">
													<ActionIcon
														size="sm"
														variant="subtle"
														color="red"
														onClick={() => removeItem(windowId, item)}
														aria-label="Удалить из плейлиста"
													>
														<IconTrash size={14} />
													</ActionIcon>
												</Tooltip>
											</Group>
										</Group>
									</Box>
								);
							})
						)}
					</Stack>
				</ScrollArea>
			</Stack>
		</Paper>
	);
}
