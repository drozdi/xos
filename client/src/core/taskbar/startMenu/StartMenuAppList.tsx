import { Box, Collapse, Group, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useMemo, useState } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppManager } from '@/core/appManager/useAppManager';

import { AppIcon } from '../taskbarUtils';
import { buildAppTree } from './buildAppTree';
import { ChevronIcon } from './startMenuIcons';
import { startMenuDividerStyle } from './startMenuDividerStyle';
import type { StartMenuAppGroup } from './types';
import { useStartMenuItemMenu } from './useStartMenuItemMenu';

interface StartMenuAppListProps {
	onClose: () => void;
	isPinned: (appId: string) => boolean;
	onPin: (appId: string) => void;
}

function AppListItem({
	appId,
	name,
	borderTop,
	isPinned,
	onLaunch,
	onPin,
}: {
	appId: string;
	name: string;
	borderTop?: boolean;
	isPinned: boolean;
	onLaunch: (appId: string) => void;
	onPin: (appId: string) => void;
}) {
	const manifest = AppRegistry.get(appId);
	const menuItems = useMemo(
		() => [
			{
				id: 'open',
				label: 'Открыть',
				onClick: () => onLaunch(appId),
			},
			{
				id: 'pin',
				label: 'Добавить на быстрый доступ',
				disabled: isPinned,
				onClick: () => onPin(appId),
			},
		],
		[appId, isPinned, onLaunch, onPin],
	);
	const { onContextMenu, menu } = useStartMenuItemMenu(menuItems);

	if (!manifest) {
		return null;
	}

	return (
		<>
			<UnstyledButton
				onClick={() => onLaunch(appId)}
				onContextMenu={onContextMenu}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 10,
					padding: '8px 10px',
					borderRadius: 4,
					color: 'var(--xos-shell-text)',
					...(borderTop ? startMenuDividerStyle : {}),
				}}
				styles={{
					root: {
						'&:hover': {
							background: 'var(--xos-shell-hover)',
						},
					},
				}}
			>
				<AppIcon icon={manifest.icon} size={18} />
				<Text size="sm">{name}</Text>
			</UnstyledButton>
			{menu}
		</>
	);
}

function GroupSection({
	group,
	isPinned,
	onLaunch,
	onPin,
}: {
	group: StartMenuAppGroup;
	isPinned: (appId: string) => boolean;
	onLaunch: (appId: string) => void;
	onPin: (appId: string) => void;
}) {
	const [opened, setOpened] = useState(false);

	return (
		<Box>
			<UnstyledButton
				onClick={() => setOpened((value) => !value)}
				aria-expanded={opened}
				aria-label={`${opened ? 'Свернуть' : 'Развернуть'} группу ${group.label}`}
				style={{
					width: '100%',
					padding: '6px 8px',
					borderRadius: 4,
					color: 'var(--mantine-color-dimmed)',
				}}
				styles={{
					root: {
						'&:hover': {
							background: 'var(--xos-shell-hover)',
						},
					},
				}}
			>
				<Group gap={8} wrap="nowrap">
					<ChevronIcon size={18} expanded={opened} />
					<Text size="xs" tt="uppercase" fw={700}>
						{group.label}
					</Text>
					<Text size="xs" c="dimmed" ml="auto">
						{group.apps.length}
					</Text>
				</Group>
			</UnstyledButton>
			<Collapse expanded={opened}>
				<Stack gap={2} pl="xs">
					{group.apps.map((app) => (
						<AppListItem
							key={app.id}
							appId={app.id}
							name={app.name}
							borderTop={app.borderTop}
							isPinned={isPinned(app.id)}
							onLaunch={onLaunch}
							onPin={onPin}
						/>
					))}
				</Stack>
			</Collapse>
		</Box>
	);
}

export function StartMenuAppList({ onClose, isPinned, onPin }: StartMenuAppListProps) {
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
				borderRight: '1px solid var(--xos-shell-border)',
				background: 'var(--xos-shell-bg)',
			}}
		>
			<Box px="md" pt="md" pb="xs">
				<Text size="sm" fw={600} c="dimmed">
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
							<GroupSection
								key={group.id}
								group={group}
								isPinned={isPinned}
								onLaunch={handleLaunch}
								onPin={onPin}
							/>
						))}
					</Stack>
				)}
			</ScrollArea>
		</Box>
	);
}

const START_MENU_LIST_HEIGHT = 468;
