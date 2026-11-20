import { Center, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { sambaApi } from '@/core/api/endpoints/sambaApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { SharesTab } from './SharesTab';

export function SharesWindow() {
	const { props } = useAppContext();
	const serverId = Number(props?.serverId ?? 0);
	const server = useQuery({
		queryKey: queryKeys.samba.server(serverId),
		queryFn: () => sambaApi.get(serverId),
		enabled: serverId > 0,
	});
	useWindowTitle(server.data ? `Шары — ${server.data.name}` : 'Шары');

	if (serverId <= 0) {
		return <Text p="md">Сервер не указан</Text>;
	}
	if (server.isLoading) {
		return (
			<Center h="100%">
				<Loader />
			</Center>
		);
	}
	if (server.isError || !server.data) {
		return <Text p="md" c="red">{extractApiErrorMessage(server.error)}</Text>;
	}
	if (!server.data.owner && !server.data.can_shares) {
		return <Text p="md">Нет права на шары</Text>;
	}

	return (
		<Stack h="100%" gap={0} style={{ minHeight: 0 }}>
			<SharesTab server={server.data} fill />
		</Stack>
	);
}
