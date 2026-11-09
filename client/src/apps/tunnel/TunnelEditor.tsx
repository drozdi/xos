import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import type { OpsLink } from '@/core/api/endpoints/opsApi';
import { sshApi } from '@/core/api/endpoints/sshApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useSaveLink } from '@/features/ops/OpsScreen';

export function TunnelEditor({ link, onClose }: { link: OpsLink | null; onClose: () => void }) {
	const connections = useQuery({ queryKey: queryKeys.ssh.connections, queryFn: () => sshApi.list() });
	const [name, setName] = useState(link?.name ?? '');
	const [sshId, setSshId] = useState(link?.ssh_connection_id ? String(link.ssh_connection_id) : '');
	const [listen, setListen] = useState(String(link?.listen_port || 15432));
	const [targetHost, setTargetHost] = useState(link?.target_host ?? '');
	const [targetPort, setTargetPort] = useState(String(link?.target_port || 5432));
	const save = useSaveLink('tunnel', onClose);

	return (
		<Stack>
			<TextInput label="Название" value={name} onChange={(event) => setName(event.currentTarget.value)} />
			<Select
				label="Подключение SSH"
				data={(connections.data ?? []).map((item) => ({
					value: String(item.id),
					label: `${item.name} · ${item.username}@${item.host}`,
				}))}
				value={sshId || null}
				onChange={(value) => setSshId(value ?? '')}
			/>
			<TextInput label="Локальный порт" value={listen} onChange={(event) => setListen(event.currentTarget.value)} />
			<TextInput label="Адрес назначения" value={targetHost} onChange={(event) => setTargetHost(event.currentTarget.value)} />
			<TextInput label="Порт назначения" value={targetPort} onChange={(event) => setTargetPort(event.currentTarget.value)} />
			{save.isError ? <Text c="red" size="sm">{extractApiErrorMessage(save.error)}</Text> : null}
			<Group justify="flex-end">
				<Button
					loading={save.isPending}
					onClick={() =>
						save.mutate({
							id: link?.id ?? null,
							payload: {
								name: name.trim(),
								ssh_connection_id: Number(sshId),
								listen_port: Number(listen),
								target_host: targetHost.trim(),
								target_port: Number(targetPort),
							},
						})
					}
				>
					Сохранить
				</Button>
			</Group>
		</Stack>
	);
}
