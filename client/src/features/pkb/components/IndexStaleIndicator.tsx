import { Badge, Button, Group, Loader, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

interface IndexStaleIndicatorProps {
	vaultId: number;
	canRebuildIndex?: boolean;
}

export function IndexStaleIndicator({ vaultId, canRebuildIndex = false }: IndexStaleIndicatorProps) {
	const queryClient = useQueryClient();

	const statusQuery = useQuery({
		queryKey: queryKeys.pkb.indexStatus(vaultId),
		queryFn: () => pkbApi.indexStatus(vaultId),
		refetchInterval: (query) => (query.state.data?.stale ? 30_000 : false),
	});

	const rebuildMutation = useMutation({
		mutationFn: () => pkbApi.rebuildIndex(vaultId),
		onSuccess: async (result) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.pkb.indexStatus(vaultId) }),
				queryClient.invalidateQueries({ queryKey: queryKeys.pkb.notes(vaultId) }),
				queryClient.invalidateQueries({ queryKey: queryKeys.pkb.graph(vaultId) }),
				queryClient.invalidateQueries({ queryKey: queryKeys.pkb.vault(vaultId) }),
			]);
			notifications.show({
				color: 'green',
				message: `Индекс обновлён (${result.noteCount} заметок)`,
			});
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось перестроить индекс' });
		},
	});

	if (statusQuery.isLoading) {
		return <Loader size="xs" />;
	}

	if (statusQuery.isError || !statusQuery.data) {
		return null;
	}

	const { stale, noteCount } = statusQuery.data;

	if (!stale && !rebuildMutation.isPending) {
		return (
			<Tooltip label={`${noteCount} заметок в индексе`}>
				<Text size="xs" c="dimmed">
					{noteCount} notes
				</Text>
			</Tooltip>
		);
	}

	return (
		<Group gap="xs">
			<Badge color="yellow" variant="light" size="sm">
				Индекс устарел
			</Badge>
			{canRebuildIndex ? (
				<Button
					size="compact-xs"
					variant="light"
					leftSection={<IconRefresh size={14} />}
					loading={rebuildMutation.isPending}
					onClick={() => rebuildMutation.mutate()}
				>
					Переиндексировать
				</Button>
			) : null}
		</Group>
	);
}
