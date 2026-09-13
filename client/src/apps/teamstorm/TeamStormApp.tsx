import { Alert, Tabs } from '@mantine/core';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useTsCredentialsQuery } from '@/features/teamstorm/api/queries';
import { canUseTeamStorm } from '@/features/teamstorm/teamstormAccess';
import { TeamStormConnectionPage } from '@/features/teamstorm/TeamStormConnectionPage';
import { TeamStormWorkitemsPage } from '@/features/teamstorm/TeamStormWorkitemsPage';

export default function TeamStormApp() {
	useWindowTitle('TeamStorm');
	const credentialsQuery = useTsCredentialsQuery();
	const configured = Boolean(credentialsQuery.data?.configured);

	if (!canUseTeamStorm()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нужна роль ROLE_TS (вкладка «Доступ к приложениям» → TeamStorm).
			</Alert>
		);
	}

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
			}}
		>
			<Tabs defaultValue="connection" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
				<Tabs.List px="md" pt="sm">
					<Tabs.Tab value="connection">Связь</Tabs.Tab>
					<Tabs.Tab value="workitems" disabled={!configured}>
						Задачи
					</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="connection" style={{ flex: 1, overflow: 'auto' }}>
					<TeamStormConnectionPage />
				</Tabs.Panel>
				<Tabs.Panel value="workitems" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
					{configured ? (
						<TeamStormWorkitemsPage />
					) : (
						<Alert m="md" color="yellow">
							Сначала сохраните URL и PrivateToken на вкладке «Связь».
						</Alert>
					)}
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
