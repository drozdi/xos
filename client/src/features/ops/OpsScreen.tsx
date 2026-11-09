import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { opsApi, type OpsKind, type OpsLink, type OpsWrite } from '@/core/api/endpoints/opsApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

type Props = {
	title: string;
	hint: string;
	kind: OpsKind;
	editor: (draft: OpsLink | null, close: () => void) => ReactNode;
	workspace: (link: OpsLink) => ReactNode;
	subtitle: (link: OpsLink) => string;
};

export function OpsScreen({ title, hint, kind, editor, workspace, subtitle }: Props) {
	useWindowTitle(title);
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<OpsLink | null>(null);

	const linksQuery = useQuery({
		queryKey: queryKeys.ops.links(kind),
		queryFn: () => opsApi.list(kind),
	});
	const remove = useMutation({
		mutationFn: (id: number) => opsApi.remove(kind, id),
		onSuccess: async () => {
			setSelectedId(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.ops.links(kind) });
		},
	});

	const links = linksQuery.data ?? [];
	const selected = links.find((link) => link.id === selectedId) ?? links[0] ?? null;

	return (
		<Group align="stretch" h="100%" gap="md" wrap="nowrap" p="md">
			<Stack w={280} gap="sm" style={{ overflow: 'auto' }}>
				<Group justify="space-between">
					<Text fw={600}>{title}</Text>
					<ActionIcon variant="subtle" aria-label="Добавить" onClick={() => setCreating(true)}>
						<IconPlus size={16} />
					</ActionIcon>
				</Group>
				<Text size="xs" c="dimmed">
					{hint}
				</Text>
				{linksQuery.isError ? (
					<Text size="sm" c="red">
						{extractApiErrorMessage(linksQuery.error, 'Не удалось загрузить список')}
					</Text>
				) : null}
				{links.length === 0 && !linksQuery.isLoading ? (
					<Text size="sm" c="dimmed">
						Нет сохранённых подключений
					</Text>
				) : null}
				{links.map((link) => (
					<Group key={link.id} gap={6} wrap="nowrap" align="flex-start">
						<Button
							variant={selected?.id === link.id ? 'light' : 'subtle'}
							justify="flex-start"
							style={{ flex: 1, minWidth: 0, height: 'auto' }}
							onClick={() => setSelectedId(link.id)}
						>
							<Stack gap={0} align="flex-start" style={{ minWidth: 0 }}>
								<Text size="sm" fw={600} truncate>
									{link.name}
								</Text>
								<Text size="xs" c="dimmed" truncate>
									{subtitle(link)}
								</Text>
							</Stack>
						</Button>
						<ActionIcon variant="subtle" aria-label="Изменить" onClick={() => setEditing(link)}>
							<IconPencil size={16} />
						</ActionIcon>
						<ActionIcon
							variant="subtle"
							aria-label="Удалить"
							color="red"
							onClick={() =>
								confirmAction({
									title: 'Удаление',
									message: `Удалить «${link.name}»?`,
									confirmLabel: 'Удалить',
									confirmColor: 'red',
									onConfirm: () => remove.mutate(link.id),
								})
							}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				))}
			</Stack>
			<Stack flex={1} gap="sm" style={{ minWidth: 0, overflow: 'auto' }}>
				{selected ? workspace(selected) : <Text c="dimmed">Выберите подключение</Text>}
			</Stack>
			<Modal opened={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? 'Изменить' : 'Новое'} centered>
				{editor(editing, () => {
					setCreating(false);
					setEditing(null);
				})}
			</Modal>
		</Group>
	);
}

export function useSaveLink(kind: OpsKind, onDone: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: { id: number | null; payload: OpsWrite }) => {
			if (input.id === null) {
				return opsApi.create(kind, input.payload);
			}
			return opsApi.update(kind, input.id, input.payload);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.ops.links(kind) });
			onDone();
		},
	});
}
