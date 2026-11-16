import { ActionIcon, Badge, Box, Group, Modal, Stack, Text } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { rdpApi, type RdpConnection } from '@/core/api/endpoints/rdpApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAppManager } from '@/core/appManager/useAppManager';
import { confirmAction } from '@/core/confirm';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { RdpEditor } from './RdpEditor';
import { RdpSession } from './RdpSession';

function zoneLabel(connection: RdpConnection): string {
	if (!connection.reachable) {
		return 'Нет доступа';
	}
	if (connection.zone_detected === 'internal') {
		return connection.network_name ? `Внутренняя · ${connection.network_name}` : 'Внутренняя';
	}
	return 'Интернет';
}

function ConnectionList() {
	useWindowTitle('Удалённый рабочий стол');
	const queryClient = useQueryClient();
	const launchApp = useAppManager((state) => state.launchApp);
	const [editor, setEditor] = useState<RdpConnection | null | undefined>(undefined);
	const connections = useQuery({ queryKey: queryKeys.rdp.connections, queryFn: () => rdpApi.list() });
	const remove = useMutation({
		mutationFn: (id: number) => rdpApi.remove(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.rdp.connections });
		},
	});

	return (
		<Stack p="md" gap="sm" h="100%" style={{ overflow: 'auto' }}>
			<Group justify="space-between">
				<Text fw={600}>Подключения</Text>
				<ActionIcon variant="light" aria-label="Новое подключение" onClick={() => setEditor(null)}>
					<IconPlus size={16} />
				</ActionIcon>
			</Group>
			<Text size="xs" c="dimmed">
				Пароль хранится на сервере. Внутренний адрес открывается только из выданной сети.
			</Text>
			{connections.isError ? (
				<Text size="sm" c="red">{extractApiErrorMessage(connections.error)}</Text>
			) : null}
			{(connections.data ?? []).map((connection) => (
				<Group key={connection.id} wrap="nowrap" align="flex-start">
					<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
						<Text size="sm" fw={600} truncate>{connection.name}</Text>
						<Text size="xs" c="dimmed" truncate>
							{connection.username}@{connection.host}:{connection.port}
						</Text>
						<Badge color={connection.reachable ? (connection.zone_detected === 'internal' ? 'blue' : 'gray') : 'red'} variant="light">
							{zoneLabel(connection)}
						</Badge>
					</Stack>
					<ActionIcon
						variant="subtle"
						aria-label="Открыть"
						onClick={() =>
							void launchApp('rdp', {
								instanceKey: `session-${connection.id}`,
								props: { connectionId: connection.id, name: connection.name },
							})
						}
					>
						<IconPlayerPlay size={16} />
					</ActionIcon>
					<ActionIcon variant="subtle" aria-label="Изменить" onClick={() => setEditor(connection)}>
						<IconPencil size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="red"
						aria-label="Удалить"
						onClick={() =>
							confirmAction({
								title: 'Удаление',
								message: `Удалить «${connection.name}»?`,
								confirmLabel: 'Удалить',
								confirmColor: 'red',
								onConfirm: () => remove.mutate(connection.id),
							})
						}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			))}
			<Modal opened={editor !== undefined} onClose={() => setEditor(undefined)} title={editor ? 'Подключение' : 'Новое подключение'} centered>
				<RdpEditor
					key={editor?.id ?? 'new'}
					connection={editor ?? null}
					onClose={() => setEditor(undefined)}
					onSaved={async () => {
						await queryClient.invalidateQueries({ queryKey: queryKeys.rdp.connections });
					}}
				/>
			</Modal>
		</Stack>
	);
}

export default function RdpApp() {
	const { props } = useAppContext();
	const connectionId = Number(props?.connectionId ?? 0);
	if (connectionId > 0) {
		return <RdpSession connectionId={connectionId} title={String(props?.name ?? 'Удалённый рабочий стол')} />;
	}
	return (
		<Box style={{ position: 'absolute', inset: 0 }}>
			<ConnectionList />
		</Box>
	);
}
