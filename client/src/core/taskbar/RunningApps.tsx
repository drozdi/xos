import { ActionIcon, Button, Group, Menu, Text } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { ContextMenu, useContextMenuItems } from '@/core/contextMenu';
import { useWmStore } from '@/core/windowManager/useWmStore';
import type { WindowState } from '@/core/windowManager/types';

import {
	AppIcon,
	groupWindowsByWmGroup,
	isGroupActive,
	shouldMinimizeGroup,
} from './taskbarUtils';

function getGroupLabel(wmGroup: string, windows: WindowState[]): string {
	const firstWindow = windows[0];
	if (!firstWindow) {return wmGroup;}

	const manifest = AppRegistry.get(firstWindow.appId);
	if (manifest) {return manifest.name;}

	return firstWindow.title || wmGroup;
}

function getGroupIcon(windows: WindowState[]) {
	const firstWindow = windows[0];
	if (!firstWindow) {return null;}

	const manifest = AppRegistry.get(firstWindow.appId);
	return manifest?.icon ?? null;
}

function TaskbarGroupContextMenu({
	wmGroup,
	groupWindows,
	children,
}: {
	wmGroup: string;
	groupWindows: WindowState[];
	children: ReactNode;
}) {
	const firstWindow = groupWindows[0];
	const manifest = firstWindow ? AppRegistry.get(firstWindow.appId) : undefined;

	const items = useContextMenuItems({
		scope: 'taskbar',
		appId: firstWindow?.appId ?? wmGroup,
		windows: groupWindows,
		wmGroup,
		windowId: firstWindow?.id,
		instanceKey: firstWindow?.instanceKey,
	});

	if (!manifest || !firstWindow) {
		return <>{children}</>;
	}

	return (
		<ContextMenu
			items={items}
			context={{
				scope: 'taskbar',
				appId: firstWindow.appId,
				manifest,
				windowId: firstWindow.id,
				instanceKey: firstWindow.instanceKey,
				windows: groupWindows,
				wmGroup,
			}}
			position="top"
			zIndex={1050}
		>
			{children}
		</ContextMenu>
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
		() => groupWindowsByWmGroup(Object.values(windows)),
		[windows],
	);

	if (groups.length === 0) {
		return null;
	}

	return (
		<Group gap={6} wrap="nowrap" style={{ overflow: 'hidden', flex: 1 }}>
			{groups.map(({ wmGroup, windows: groupWindows }) => {
				const label = getGroupLabel(wmGroup, groupWindows);
				const icon = getGroupIcon(groupWindows);
				const active = isGroupActive(groupWindows, activeWindowId);

				const handleGroupClick = () => {
					if (shouldMinimizeGroup(groupWindows)) {
						minimizeGroup(wmGroup);
						return;
					}
					restoreGroup(wmGroup);
				};

				const handleActivate = (windowId: string) => {
					restoreWindow(windowId);
					focusWindow(windowId);
				};

				return (
					<Menu
						key={wmGroup}
						position="top"
						offset={8}
						zIndex={1050}
						withinPortal
						trigger="hover"
						openDelay={100}
						closeDelay={200}
					>
						<Menu.Target>
							<TaskbarGroupContextMenu wmGroup={wmGroup} groupWindows={groupWindows}>
								<Button
									variant={active ? 'light' : 'subtle'}
									color={active ? 'blue' : 'gray'}
									size="compact-sm"
									leftSection={icon ? <AppIcon icon={icon} size={16} /> : undefined}
									onClick={handleGroupClick}
									style={{ maxWidth: 180 }}
								>
									<Text size="xs" truncate>
										{label}
										{groupWindows.length > 1 ? ` (${groupWindows.length})` : ''}
									</Text>
								</Button>
							</TaskbarGroupContextMenu>
						</Menu.Target>

						<Menu.Dropdown>
							{groupWindows.map((window) => (
								<Menu.Item
									key={window.id}
									rightSection={
										<ActionIcon
											variant="subtle"
											color="gray"
											size="sm"
											aria-label={`Close ${window.title}`}
											onClick={(event) => {
												event.stopPropagation();
												closeWindow(window.id);
											}}
										>
											×
										</ActionIcon>
									}
									onClick={() => handleActivate(window.id)}
								>
									<Text size="sm" truncate maw={220}>
										{window.title}
										{window.minimized ? ' (minimized)' : ''}
									</Text>
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
				);
			})}
		</Group>
	);
}
