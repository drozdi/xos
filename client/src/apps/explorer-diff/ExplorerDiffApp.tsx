import { Box, Button, Center, Code, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createTwoFilesPatch } from 'diff';
import { useCallback, useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';

const TEXT_TYPES = ['text', 'code', 'markdown'];

export default function ExplorerDiffApp() {
	useWindowTitle('Сравнение');
	const { windowId, appId } = useAppContext();
	const leftConsumer = `${appId}:left:${windowId}`;
	const rightConsumer = `${appId}:right:${windowId}`;
	const [leftPath, setLeftPath] = useState<string | null>(null);
	const [rightPath, setRightPath] = useState<string | null>(null);

	useExplorerPickerResult(leftConsumer, (path) => setLeftPath(path));
	useExplorerPickerResult(rightConsumer, (path) => setRightPath(path));

	const openLeft = useCallback(async () => {
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: leftConsumer,
			fileTypes: TEXT_TYPES,
			title: 'Левый файл',
		});
	}, [leftConsumer]);

	const openRight = useCallback(async () => {
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: rightConsumer,
			fileTypes: TEXT_TYPES,
			title: 'Правый файл',
		});
	}, [rightConsumer]);

	const leftQuery = useQuery({
		queryKey: ['explorer', 'diff-left', leftPath ?? ''],
		queryFn: () => fetchExplorerText(leftPath!),
		enabled: Boolean(leftPath),
	});
	const rightQuery = useQuery({
		queryKey: ['explorer', 'diff-right', rightPath ?? ''],
		queryFn: () => fetchExplorerText(rightPath!),
		enabled: Boolean(rightPath),
	});

	const loading = (leftPath && leftQuery.isLoading) || (rightPath && rightQuery.isLoading);
	const ready = Boolean(leftPath && rightPath && leftQuery.data !== undefined && rightQuery.data !== undefined);

	const patch = ready
		? createTwoFilesPatch(
				getExplorerFileName(leftPath!),
				getExplorerFileName(rightPath!),
				leftQuery.data ?? '',
				rightQuery.data ?? '',
				undefined,
				undefined,
				{ context: 3 },
			)
		: '';

	return (
		<Stack h="100%" gap={0} style={{ minHeight: 0 }}>
			<Group
				px="md"
				py="xs"
				gap="sm"
				wrap="wrap"
				style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
			>
				<Button size="xs" variant="light" onClick={() => void openLeft()}>
					Левый: {leftPath ? getExplorerFileName(leftPath) : 'выбрать…'}
				</Button>
				<Button size="xs" variant="light" onClick={() => void openRight()}>
					Правый: {rightPath ? getExplorerFileName(rightPath) : 'выбрать…'}
				</Button>
			</Group>
			<Box style={{ flex: 1, minHeight: 0 }}>
				{loading ? (
					<Center h="100%">
						<Loader size="sm" />
					</Center>
				) : !ready ? (
					<Center h="100%" p="md">
						<Text c="dimmed">Выберите два текстовых файла для сравнения</Text>
					</Center>
				) : (
					<ScrollArea h="100%" type="auto" offsetScrollbars>
						<Code
							block
							style={{
								margin: 0,
								borderRadius: 0,
								fontSize: 12,
								lineHeight: 1.45,
								whiteSpace: 'pre',
							}}
						>
							{patch.split('\n').map((line, i) => {
								let color: string | undefined;
								if (line.startsWith('+') && !line.startsWith('+++')) {
									color = 'var(--mantine-color-green-8)';
								} else if (line.startsWith('-') && !line.startsWith('---')) {
									color = 'var(--mantine-color-red-8)';
								} else if (line.startsWith('@@')) {
									color = 'var(--mantine-color-blue-7)';
								}
								return (
									<span key={i} style={{ display: 'block', color, background: color ? `${color}14` : undefined }}>
										{line || ' '}
									</span>
								);
							})}
						</Code>
					</ScrollArea>
				)}
			</Box>
		</Stack>
	);
}
