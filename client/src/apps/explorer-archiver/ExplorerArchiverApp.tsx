import { Button, Flex, Form, Input, Table, Typography } from 'antd';
import { notifications } from '@/ui/toast';
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
		<Flex vertical gap="small" style={{ height: '100%', padding: 16, minHeight: 0 }}>
			<Flex justify="space-between">
				<Typography.Text strong>Архиватор</Typography.Text>
				<Button size="small" onClick={() => void openFile()}>
					Открыть…
				</Button>
			</Flex>
			<Form.Item label="Архив" style={{ marginBottom: 0 }}>
				<Input value={archivePath} onChange={(e) => setArchivePath(e.target.value)} />
			</Form.Item>
			<Form.Item label="Папка назначения" style={{ marginBottom: 0 }}>
				<Input value={destination} onChange={(e) => setDestination(e.target.value)} />
			</Form.Item>
			<Flex gap="small" align="center">
				<Button
					type="primary"
					onClick={() => unpackMutation.mutate()}
					loading={unpackMutation.isPending}
					disabled={!archivePath || !destination}
				>
					Распаковать
				</Button>
				{contentsQuery.data ? (
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						Файлов: {contentsQuery.data.items.length}, размер: {totalSize} байт
					</Typography.Text>
				) : null}
			</Flex>

			<div style={{ flex: 1, overflow: 'auto' }}>
				<Table
					size="small"
					pagination={false}
					rowKey="name"
					dataSource={contentsQuery.data?.items ?? []}
					columns={[
						{ title: 'Имя', dataIndex: 'name' },
						{
							title: 'Размер',
							render: (_: unknown, item: { folder?: boolean; size: number }) =>
								item.folder ? '—' : item.size,
						},
					]}
				/>
			</div>
		</Flex>
	);
}
