import { Box, ScrollArea, SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import { useMemo } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { useAppManager } from '@/core/appManager/useAppManager';

import { AppIcon } from '../taskbarUtils';
import { START_MENU_TILES_WIDTH } from './defaults';
import { useStartMenuItemMenu } from './useStartMenuItemMenu';

interface StartMenuTilesProps {
	apps: AppManifest[];
	onClose: () => void;
	onUnpin: (appId: string) => void;
}

export function StartMenuTiles({ apps, onClose, onUnpin }: StartMenuTilesProps) {
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
				background: 'var(--xos-shell-bg)',
			}}
		>
			<Box px="md" pt="md" pb="xs">
				<Text size="sm" fw={600} c="dimmed">
					Быстрый доступ
				</Text>
			</Box>
			<ScrollArea h={468} px="md" pb="md" type="auto">
				{apps.length === 0 ? (
					<Text size="sm" c="dimmed">
						Добавьте приложения из списка через контекстное меню
					</Text>
				) : (
					<SimpleGrid cols={3} spacing="sm">
						{apps.map((app) => (
							<StartMenuTile
								key={app.id}
								app={app}
								onLaunch={handleLaunch}
								onUnpin={onUnpin}
							/>
						))}
					</SimpleGrid>
				)}
			</ScrollArea>
		</Box>
	);
}

function StartMenuTile({
	app,
	onLaunch,
	onUnpin,
}: {
	app: AppManifest;
	onLaunch: (appId: string) => void;
	onUnpin: (appId: string) => void;
}) {
	const menuItems = useMemo(
		() => [
			{
				id: 'open',
				label: 'Открыть',
				onClick: () => onLaunch(app.id),
			},
			{
				id: 'unpin',
				label: 'Открепить от быстрого доступа',
				onClick: () => onUnpin(app.id),
			},
		],
		[app.id, onLaunch, onUnpin],
	);
	const { onContextMenu, menu } = useStartMenuItemMenu(menuItems);

	return (
		<>
			<UnstyledButton
				onClick={() => onLaunch(app.id)}
				onContextMenu={onContextMenu}
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 6,
					padding: '10px 6px',
					borderRadius: 6,
					color: 'var(--xos-shell-text)',
					minHeight: 88,
				}}
				styles={{
					root: {
						'&:hover': {
							background: 'var(--xos-shell-hover)',
						},
					},
				}}
			>
				<AppIcon icon={app.icon} size={28} />
				<Text size="xs" ta="center" lineClamp={2}>
					{app.name}
				</Text>
			</UnstyledButton>
			{menu}
		</>
	);
}
