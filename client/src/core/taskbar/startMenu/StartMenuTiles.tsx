import { Box, ScrollArea, SimpleGrid, Text, UnstyledButton } from '@mantine/core';

import type { AppManifest } from '@/core/appManager/types';
import { useAppManager } from '@/core/appManager/useAppManager';

import { AppIcon } from '../taskbarUtils';
import { START_MENU_TILES_WIDTH } from './defaults';

interface StartMenuTilesProps {
	apps: AppManifest[];
	onClose: () => void;
}

export function StartMenuTiles({ apps, onClose }: StartMenuTilesProps) {
	const launchApp = useAppManager((state) => state.launchApp);

	const handleLaunch = (appId: string) => {
		onClose();
		void launchApp(appId);
	};

	return (
		<Box
			w={START_MENU_TILES_WIDTH}
			style={{
				flexShrink: 0,
				background: 'var(--mantine-color-dark-7)',
			}}
		>
			<Box px="md" pt="md" pb="xs">
				<Text size="sm" fw={600} c="gray.3">
					Быстрый доступ
				</Text>
			</Box>
			<ScrollArea h={468} px="md" pb="md" type="auto">
				{apps.length === 0 ? (
					<Text size="sm" c="dimmed">
						Закрепите приложения в параметрах startMenu.pinnedApps
					</Text>
				) : (
					<SimpleGrid cols={3} spacing="sm">
						{apps.map((app) => (
							<UnstyledButton
								key={app.id}
								onClick={() => handleLaunch(app.id)}
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 6,
									padding: '10px 6px',
									borderRadius: 6,
									color: 'var(--mantine-color-gray-0)',
									minHeight: 88,
								}}
								styles={{
									root: {
										'&:hover': {
											background: 'var(--mantine-color-dark-6)',
										},
									},
								}}
							>
								<AppIcon icon={app.icon} size={28} />
								<Text size="xs" ta="center" lineClamp={2}>
									{app.name}
								</Text>
							</UnstyledButton>
						))}
					</SimpleGrid>
				)}
			</ScrollArea>
		</Box>
	);
}
