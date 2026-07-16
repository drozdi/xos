import { Box, Collapse, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppManager } from '@/core/appManager/useAppManager';

import { AppIcon } from '../taskbarUtils';
import { buildAppTree } from './buildAppTree';
import type { StartMenuAppGroup } from './types';

interface StartMenuAppListProps {
	onClose: () => void;
}

function GroupSection({
	group,
	onLaunch,
}: {
	group: StartMenuAppGroup;
	onLaunch: (appId: string) => void;
}) {
	const [opened, setOpened] = useState(true);

	return (
		<Box>
			<UnstyledButton
				onClick={() => setOpened((value) => !value)}
				style={{
					width: '100%',
					padding: '6px 8px',
					borderRadius: 4,
					color: 'var(--mantine-color-gray-4)',
				}}
			>
				<Text size="xs" tt="uppercase" fw={700}>
					{group.label}
				</Text>
			</UnstyledButton>
			<Collapse expanded={opened}>
				<Stack gap={2} pl="xs">
					{group.apps.map((app) => {
						const manifest = AppRegistry.get(app.id);
						if (!manifest) {
							return null;
						}
						return (
							<UnstyledButton
								key={app.id}
								onClick={() => onLaunch(app.id)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									padding: '8px 10px',
									borderRadius: 4,
									color: 'var(--mantine-color-gray-0)',
								}}
								styles={{
									root: {
										'&:hover': {
											background: 'var(--mantine-color-dark-6)',
										},
									},
								}}
							>
								<AppIcon icon={manifest.icon} size={18} />
								<Text size="sm">{app.name}</Text>
							</UnstyledButton>
						);
					})}
				</Stack>
			</Collapse>
		</Box>
	);
}

export function StartMenuAppList({ onClose }: StartMenuAppListProps) {
	const launchApp = useAppManager((state) => state.launchApp);
	const groups = buildAppTree(AppRegistry.getAvailable());

	const handleLaunch = (appId: string) => {
		onClose();
		void launchApp(appId);
	};

	return (
		<Box
			style={{
				flex: 1,
				minWidth: 0,
				borderRight: '1px solid var(--mantine-color-dark-5)',
				background: 'var(--mantine-color-dark-7)',
			}}
		>
			<Box px="md" pt="md" pb="xs">
				<Text size="sm" fw={600} c="gray.3">
					Все приложения
				</Text>
			</Box>
			<ScrollArea h={START_MENU_LIST_HEIGHT} type="auto" px="sm" pb="md">
				{groups.length === 0 ? (
					<Text size="sm" c="dimmed" p="md">
						Нет доступных приложений
					</Text>
				) : (
					<Stack gap="sm">
						{groups.map((group) => (
							<GroupSection key={group.id} group={group} onLaunch={handleLaunch} />
						))}
					</Stack>
				)}
			</ScrollArea>
		</Box>
	);
}

const START_MENU_LIST_HEIGHT = 468;
