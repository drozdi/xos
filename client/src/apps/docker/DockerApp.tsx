import { Button, Group, Stack, Text } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { opsApi, type OpsLink } from '@/core/api/endpoints/opsApi';
import { queryKeys } from '@/core/api/queryKeys';
import { OpsScreen } from '@/features/ops/OpsScreen';

import { DockerEditor } from './DockerEditor';

function Containers({ link }: { link: OpsLink }) {
	const queryClient = useQueryClient();
	const [logs, setLogs] = useState<string | null>(null);
	const containers = useQuery({
		queryKey: queryKeys.ops.docker(link.id),
		queryFn: () => opsApi.containers(link.id),
	});
	const action = useMutation({
		mutationFn: (input: { id: string; action: 'start' | 'stop' }) =>
			opsApi.containerAction(link.id, input.id, input.action),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.ops.docker(link.id) });
		},
	});
	const log = useMutation({
		mutationFn: (id: string) => opsApi.logs(link.id, id),
		onSuccess: (text) => setLogs(text),
	});

	return (
		<Stack gap="sm">
			<Text fw={600}>{link.name}</Text>
			<Text size="xs" c="dimmed">
				{link.host}. Старт, стоп и последние строки журнала.
			</Text>
			{containers.isError ? <Text c="red" size="sm">{extractApiErrorMessage(containers.error)}</Text> : null}
			{action.isError ? <Text c="red" size="sm">{extractApiErrorMessage(action.error)}</Text> : null}
			{(containers.data ?? []).map((container) => (
				<Group key={container.id} justify="space-between" wrap="nowrap">
					<Stack gap={0} style={{ minWidth: 0 }}>
						<Text size="sm" fw={600} truncate>
							{container.name}
						</Text>
						<Text size="xs" c="dimmed" truncate>
							{container.image} · {container.status}
						</Text>
					</Stack>
					<Group gap={6} wrap="nowrap">
						<Button size="xs" variant="light" onClick={() => log.mutate(container.id)}>
							Журнал
						</Button>
						<Button
							size="xs"
							variant="light"
							loading={action.isPending}
							onClick={() =>
								action.mutate({
									id: container.id,
									action: container.state === 'running' ? 'stop' : 'start',
								})
							}
						>
							{container.state === 'running' ? 'Стоп' : 'Старт'}
						</Button>
					</Group>
				</Group>
			))}
			{log.isError ? <Text c="red" size="sm">{extractApiErrorMessage(log.error)}</Text> : null}
			{logs !== null ? (
				<Text component="pre" size="xs" style={{ whiteSpace: 'pre-wrap' }}>
					{logs || 'Журнал пуст'}
				</Text>
			) : null}
		</Stack>
	);
}

export default function DockerApp() {
	return (
		<OpsScreen
			title="Docker"
			hint="Публичный адрес API, без пути."
			kind="docker"
			subtitle={(link) => link.host}
			editor={(link, close) => <DockerEditor key={link?.id ?? 'new'} link={link} onClose={close} />}
			workspace={(link) => <Containers key={link.id} link={link} />}
		/>
	);
}
