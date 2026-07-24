import { Button, Dropdown, Flex, Typography } from 'antd';
import type { MenuProps } from 'antd';
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
				type={active ? 'primary' : 'text'}
				ghost={active}
				size="small"
				icon={icon ? <AppIcon icon={icon} size={16} /> : undefined}
				onClick={onClick}
				onContextMenu={manifest && firstWindow ? onContextMenu : undefined}
				style={{ maxWidth: 180 }}
			>
				<Typography.Text ellipsis style={{ fontSize: 12, maxWidth: 120 }}>
					{label}
					{groupWindows.length > 1 ? ` (${groupWindows.length})` : ''}
				</Typography.Text>
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
		<Flex gap={6} wrap="nowrap" style={{ overflow: 'hidden', flex: 1 }}>
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

				const menuItems: MenuProps['items'] = groupWindows.map((window) => {
					const manifest = AppRegistry.get(window.appId);
					const windowIcon = manifest?.icon;
					return {
						key: window.id,
						label: (
							<Flex align="center" justify="space-between" gap={8} style={{ minWidth: 180 }}>
								<Typography.Text ellipsis style={{ maxWidth: 220, fontSize: 13 }}>
									{window.title}
									{window.minimized ? ' (свернуто)' : ''}
								</Typography.Text>
								<Button
									type="text"
									size="small"
									aria-label={`Close ${window.title}`}
									onClick={(event) => {
										event.stopPropagation();
										closeWindow(window.id);
									}}
								>
									×
								</Button>
							</Flex>
						),
						icon: windowIcon ? <AppIcon icon={windowIcon} size={16} /> : undefined,
						onClick: () => handleActivate(window.id),
					};
				});

				return (
					<Dropdown
						key={taskbarGroup}
						menu={{ items: menuItems }}
						trigger={['hover', 'click']}
						placement="topLeft"
						overlayStyle={{ zIndex: TASKBAR_MENU_Z_INDEX }}
						mouseEnterDelay={0.1}
						mouseLeaveDelay={0.4}
					>
						<span style={{ display: 'inline-flex' }}>
							<TaskbarGroupButton
								taskbarGroup={taskbarGroup}
								groupWindows={groupWindows}
								active={active}
								label={label}
								icon={icon}
								onClick={handleGroupClick}
							/>
						</span>
					</Dropdown>
				);
			})}
		</Flex>
	);
}
