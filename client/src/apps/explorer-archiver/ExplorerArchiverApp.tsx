import { Button, Group, ScrollArea, Stack, Table, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { fetchArchiveContents, unpackExplorerArchive } from '@/features/explorer/explorerApi';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { useExplorerOpenFile } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

function defaultUnpackFolder(archivePath: string) {
	const normalized = archivePath.replace(/\/+$/, '');
	const slash = normalized.lastIndexOf('/');
	const folder = slash >= 0 ? normalized.slice(0, slash + 1) : normalized.endsWith('://') ? normalized : `${normalized}/`;
	const fileName = slash >= 0 ? normalized.slice(slash + 1) : normalized;
	const baseName = fileName.replace(/\.zip$/i, '');
	return `${folder}${baseName}/`;
}

export default function ExplorerArchiverApp() {
	const openedPath = useExplorerOpenFile('explorer-archiver');
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-archiver',
		fileTypes: ['archive'],
	});
	const [archivePath, setArchivePath] = useState('');
	const [destination, setDestination] = useState('');

	useEffect(() => {
		if (openedPath) {
			setArchivePath(openedPath);
			setDestination(defaultUnpackFolder(openedPath));
		}
	}, [openedPath]);

	useEffect(() => {
		if (!currentPath) {
			return;
		}
		setArchivePath(currentPath);
		setDestination(defaultUnpackFolder(currentPath));
	}, [currentPath]);

	useWindowTitle(archivePath ? getExplorerFileName(archivePath) : 'Архиватор');

	const contentsQuery = useQuery({
		queryKey: ['explorer', 'archive', archivePath],
		queryFn: () => fetchArchiveContents(archivePath),
		enabled: archivePath.length > 0,
	});

	const unpackMutation = useMutation({
		mutationFn: () => unpackExplorerArchive(archivePath, destination),
		onSuccess: (result) => {
			notifications.show({
				message: `Распаковано файлов: ${result.extracted}`,
				color: 'green',
			});
		},
		onError: () => {
			notifications.show({ message: 'Не удалось распаковать архив', color: 'red' });
		},
	});

	const totalSize = useMemo(
		() => (contentsQuery.data?.items ?? []).reduce((sum, item) => sum + item.size, 0),
		[contentsQuery.data?.items],
	);

	return (
		<Stack h="100%" p="md" gap="sm" style={{ minHeight: 0 }}>
			<Group justify="space-between">
				<Text fw={600}>Архиватор</Text>
				<Button variant="default" size="xs" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Group>
			<TextInput label="Архив" value={archivePath} onChange={(e) => setArchivePath(e.currentTarget.value)} />
			<TextInput
				label="Папка назначения"
				value={destination}
				onChange={(e) => setDestination(e.currentTarget.value)}
			/>
			<Group>
				<Button
					onClick={() => unpackMutation.mutate()}
					loading={unpackMutation.isPending}
					disabled={!archivePath || !destination}
				>
					Распаковать
				</Button>
				{contentsQuery.data && (
					<Text size="sm" c="dimmed">
						Файлов: {contentsQuery.data.items.length}, размер: {totalSize} байт
					</Text>
				)}
			</Group>

			<ScrollArea style={{ flex: 1 }}>
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Имя</Table.Th>
							<Table.Th>Размер</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(contentsQuery.data?.items ?? []).map((item) => (
							<Table.Tr key={item.name}>
								<Table.Td>{item.name}</Table.Td>
								<Table.Td>{item.folder ? '—' : item.size}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Stack>
	);
}
