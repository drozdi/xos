import { ActionIcon, Box, Button, Group, Menu, Text } from '@mantine/core';
import { useMemo } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useContextMenuAnchor, useContextMenuItems } from '@/core/contextMenu';
import { useWmStore } from '@/core/windowManager/useWmStore';
import type { WindowState } from '@/core/windowManager/types';

import { getTaskbarGroupLabel } from './groupLabels';
import {
	AppIcon,
	groupWindowsByTaskbarGroup,
	isGroupActive,
	shouldMinimizeGroup,
} from './taskbarUtils';

const TASKBAR_MENU_Z_INDEX = 1100;

function getGroupLabel(taskbarGroup: string, windows: WindowState[]): string {
	if (windows.length === 1) {
		const firstWindow = windows[0];
		if (!firstWindow) {
			return taskbarGroup;
		}
		const manifest = AppRegistry.get(firstWindow.appId);
		return manifest?.name ?? firstWindow.title ?? taskbarGroup;
	}

	return getTaskbarGroupLabel(taskbarGroup);
}

function getGroupIcon(windows: WindowState[]) {
	const firstWindow = windows[0];
	if (!firstWindow) {
		return null;
	}

	const manifest = AppRegistry.get(firstWindow.appId);
	return manifest?.icon ?? null;
}

function TaskbarWindowMenuItem({
	window,
	taskbarGroup,
	onActivate,
	onClose,
}: {
	window: WindowState;
	taskbarGroup: string;
	onActivate: () => void;
	onClose: () => void;
}) {
	const manifest = AppRegistry.get(window.appId);
	const items = useContextMenuItems({
		scope: 'taskbar',
		appId: window.appId,
		windowId: window.id,
		instanceKey: window.instanceKey,
		window,
		windows: [window],
		wmGroup: taskbarGroup,
	});

	const { onContextMenu, menu } = useContextMenuAnchor(
		items,
		{
			scope: 'taskbar',
			appId: window.appId,
			manifest: manifest!,
			windowId: window.id,
			instanceKey: window.instanceKey,
			window,
			windows: [window],
			wmGroup: taskbarGroup,
		},
		{ position: 'top', zIndex: TASKBAR_MENU_Z_INDEX + 100 },
	);

	const icon = manifest?.icon;

	return (
		<>
			<Menu.Item
				leftSection={icon ? <AppIcon icon={icon} size={16} /> : undefined}
				rightSection={
					<ActionIcon
						variant="subtle"
						color="gray"
						size="sm"
						aria-label={`Close ${window.title}`}
						onClick={(event) => {
							event.stopPropagation();
							onClose();
						}}
					>
						×
					</ActionIcon>
				}
				onClick={onActivate}
				onContextMenu={manifest ? onContextMenu : undefined}
			>
				<Text size="sm" truncate maw={220}>
					{window.title}
					{window.minimized ? ' (свернуто)' : ''}
				</Text>
			</Menu.Item>
			{manifest ? menu : null}
		</>
	);
}

function TaskbarGroupButton({
	taskbarGroup,
	groupWindows,
	active,
	label,
	icon,
	onClick,
}: {
	taskbarGroup: string;
	groupWindows: WindowState[];
	active: boolean;
	label: string;
	icon: ReturnType<typeof getGroupIcon>;
	onClick: () => void;
}) {
	const firstWindow = groupWindows[0];
	const manifest = firstWindow ? AppRegistry.get(firstWindow.appId) : undefined;

	const items = useContextMenuItems({
		scope: 'taskbar',
		appId: firstWindow?.appId ?? taskbarGroup,
		windows: groupWindows,
		window: groupWindows.length === 1 ? firstWindow : undefined,
		wmGroup: taskbarGroup,
		windowId: firstWindow?.id,
		instanceKey: firstWindow?.instanceKey,
	});

	const { onContextMenu, menu } = useContextMenuAnchor(
		items,
		{
			scope: 'taskbar',
			appId: firstWindow?.appId ?? taskbarGroup,
			manifest: manifest!,
			windowId: firstWindow?.id,
			instanceKey: firstWindow?.instanceKey,
			windows: groupWindows,
			wmGroup: taskbarGroup,
		},
		{ position: 'top', zIndex: TASKBAR_MENU_Z_INDEX + 100 },
	);

	return (
		<>
			<Button
				variant={active ? 'light' : 'subtle'}
				color={active ? 'blue' : 'gray'}
				size="compact-sm"
				leftSection={icon ? <AppIcon icon={icon} size={16} /> : undefined}
				onClick={onClick}
				onContextMenu={manifest && firstWindow ? onContextMenu : undefined}
				style={{ maxWidth: 180 }}
			>
				<Text size="xs" truncate>
					{label}
					{groupWindows.length > 1 ? ` (${groupWindows.length})` : ''}
				</Text>
			</Button>
			{manifest && firstWindow ? menu : null}
		</>
	);
}

export function RunningApps() {
	const windows = useWmStore((state) => state.windows);
	const activeWindowId = useWmStore((state) => state.activeWindowId);
	const focusWindow = useWmStore((state) => state.focusWindow);
	const restoreWindow = useWmStore((state) => state.restoreWindow);
	const closeWindow = useWmStore((state) => state.closeWindow);
	const minimizeGroup = useWmStore((state) => state.minimizeGroup);
	const restoreGroup = useWmStore((state) => state.restoreGroup);

	const groups = useMemo(
		() => groupWindowsByTaskbarGroup(Object.values(windows)),
		[windows],
	);

	if (groups.length === 0) {
		return null;
	}

	return (
		<Group gap={6} wrap="nowrap" style={{ overflow: 'hidden', flex: 1 }}>
			{groups.map(({ taskbarGroup, windows: groupWindows }) => {
				const label = getGroupLabel(taskbarGroup, groupWindows);
				const icon = getGroupIcon(groupWindows);
				const active = isGroupActive(groupWindows, activeWindowId);

				const handleGroupClick = () => {
					if (shouldMinimizeGroup(groupWindows)) {
						minimizeGroup(taskbarGroup);
						return;
					}
					restoreGroup(taskbarGroup);
				};

				const handleActivate = (windowId: string) => {
					restoreWindow(windowId);
					focusWindow(windowId);
				};

				const button = (
					<TaskbarGroupButton
						taskbarGroup={taskbarGroup}
						groupWindows={groupWindows}
						active={active}
						label={label}
						icon={icon}
						onClick={handleGroupClick}
					/>
				);

				return (
					<Menu
						key={taskbarGroup}
						position="top"
						offset={0}
						zIndex={TASKBAR_MENU_Z_INDEX}
						withinPortal
						floatingStrategy="fixed"
						trigger="click-hover"
						openDelay={100}
						closeDelay={400}
						closeOnItemClick={false}
					>
						<Menu.Target>
							<Box component="span" style={{ display: 'inline-flex' }}>
								{button}
							</Box>
						</Menu.Target>

						<Menu.Dropdown>
							{groupWindows.map((window) => (
								<TaskbarWindowMenuItem
									key={window.id}
									window={window}
									taskbarGroup={taskbarGroup}
									onActivate={() => handleActivate(window.id)}
									onClose={() => closeWindow(window.id)}
								/>
							))}
						</Menu.Dropdown>
					</Menu>
				);
			})}
		</Group>
	);
}
