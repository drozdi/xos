import { ActionIcon, Button, Group, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { rdpApi, type RdpNetwork } from '@/core/api/endpoints/rdpApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

export default function RdpNetworksApp() {
	useWindowTitle('Сети RDP');
	const queryClient = useQueryClient();
	const networks = useQuery({ queryKey: queryKeys.rdp.adminNetworks, queryFn: () => rdpApi.adminNetworks() });
	const [name, setName] = useState('');
	const [cidrs, setCidrs] = useState('');
	const [suffixes, setSuffixes] = useState('');
	const [clipboard, setClipboard] = useState(true);
	const [drive, setDrive] = useState(false);
	const [groupId, setGroupId] = useState('');
	const [role, setRole] = useState('');
	const [error, setError] = useState<string | null>(null);
	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.rdp.adminNetworks });
	};
	const create = useMutation({
		mutationFn: () =>
			rdpApi.createNetwork({
				name: name.trim(),
				cidrs: cidrs.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
				dns_suffixes: suffixes.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
				allow_clipboard: clipboard,
				allow_drive: drive,
			}),
		onSuccess: async (network) => {
			const grants = [];
			if (groupId.trim()) {
				grants.push({ group_id: Number(groupId) });
			}
			if (role.trim()) {
				grants.push({ role: role.trim() });
			}
			if (grants.length > 0 && network.id) {
				await rdpApi.replaceGrants(network.id, grants);
			}
			setName('');
			setCidrs('');
			setSuffixes('');
			setGroupId('');
			setRole('');
			await refresh();
		},
		onError: (reason: unknown) => setError(extractApiErrorMessage(reason)),
	});
	const remove = useMutation({
		mutationFn: (id: number) => rdpApi.removeNetwork(id),
		onSuccess: refresh,
	});

	return (
		<Stack p="md" gap="sm" h="100%" style={{ overflow: 'auto' }}>
			<Text fw={600}>Сети</Text>
			<Text size="xs" c="dimmed">
				Внутренний адрес открывается, только если он попал в сеть, выданную группе или роли.
			</Text>
			{networks.isError ? <Text c="red" size="sm">{extractApiErrorMessage(networks.error)}</Text> : null}
			{(networks.data ?? []).map((network) => (
				<NetworkRow key={network.id} network={network} onDelete={() => remove.mutate(network.id)} />
			))}
			<Text fw={600} mt="md">Новая сеть</Text>
			<TextInput label="Название" value={name} onChange={(event) => setName(event.currentTarget.value)} />
			<Textarea label="CIDR" description="По одной сети в строке, например 10.1.0.0/16" value={cidrs} onChange={(event) => setCidrs(event.currentTarget.value)} minRows={3} />
			<TextInput label="Суффиксы DNS" value={suffixes} onChange={(event) => setSuffixes(event.currentTarget.value)} />
			<Group>
				<TextInput label="Группа" description="Идентификатор группы" value={groupId} onChange={(event) => setGroupId(event.currentTarget.value)} />
				<TextInput label="Роль" placeholder="ROLE_RDP" value={role} onChange={(event) => setRole(event.currentTarget.value)} />
			</Group>
			<Switch label="Буфер обмена" checked={clipboard} onChange={(event) => setClipboard(event.currentTarget.checked)} />
			<Switch label="Диски" checked={drive} onChange={(event) => setDrive(event.currentTarget.checked)} />
			{error ? <Text c="red" size="sm">{error}</Text> : null}
			<Button w="fit-content" loading={create.isPending} onClick={() => { setError(null); create.mutate(); }}>
				Создать
			</Button>
		</Stack>
	);
}

function NetworkRow({ network, onDelete }: { network: RdpNetwork; onDelete: () => void }) {
	const grants = (network.grants ?? [])
		.map((grant) => grant.group_name || (grant.group_id ? `группа ${grant.group_id}` : grant.role))
		.filter(Boolean)
		.join(', ');

	return (
		<Group justify="space-between" wrap="nowrap">
			<Stack gap={0}>
				<Text size="sm" fw={600}>{network.name}</Text>
				<Text size="xs" c="dimmed">{network.cidrs.join(', ')}</Text>
				<Text size="xs" c="dimmed">{grants || 'Нет выдачи'}</Text>
			</Stack>
			<ActionIcon
				variant="subtle"
				color="red"
				aria-label="Удалить"
				onClick={() =>
					confirmAction({
						title: 'Удаление',
						message: `Удалить сеть «${network.name}»? Подключения останутся, но потеряют доступ.`,
						confirmLabel: 'Удалить',
						confirmColor: 'red',
						onConfirm: onDelete,
					})
				}
			>
				<IconTrash size={16} />
			</ActionIcon>
		</Group>
	);
}
