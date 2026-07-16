import { ActionIcon, Box, Menu, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useState, type ReactNode } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { useAppManager } from '@/core/appManager/useAppManager';
import { useAuthStore } from '@/core/auth/authStore';

import { AppIcon } from '../taskbarUtils';
import {
	START_MENU_SIDEBAR_EXPANDED_WIDTH,
	START_MENU_SIDEBAR_WIDTH,
} from './defaults';
import { PowerIcon, ReloadIcon, SettingsIcon } from './startMenuIcons';
import type { StartMenuCommand } from './types';

interface SidebarQuickAction {
	id: string;
	label: string;
	type: 'app' | 'command';
	appId?: string;
	command?: string;
	icon?: AppManifest['icon'];
}

interface StartMenuSidebarProps {
	quickActions: SidebarQuickAction[];
	onClose: () => void;
}

export function StartMenuSidebar({ quickActions, onClose }: StartMenuSidebarProps) {
	const [expanded, setExpanded] = useState(false);
	const launchApp = useAppManager((state) => state.launchApp);
	const logout = useAuthStore((state) => state.logout);

	const runCommand = (command: StartMenuCommand) => {
		onClose();
		if (command === 'settings') {
			void launchApp('settings');
			return;
		}
		if (command === 'logout') {
			void logout();
			return;
		}
		window.location.reload();
	};

	const runQuickAction = (action: SidebarQuickAction) => {
		onClose();
		if (action.type === 'app' && action.appId) {
			void launchApp(action.appId);
			return;
		}
		if (action.type === 'command' && action.command) {
			runCommand(action.command as StartMenuCommand);
		}
	};

	const items = (
		<>
			<SidebarButton
				label="Параметры"
				icon={<SettingsIcon size={20} />}
				expanded={expanded}
				onClick={() => runCommand('settings')}
			/>
			<PowerMenuButton expanded={expanded} onCommand={runCommand} />
			{quickActions.map((action) => (
				<SidebarButton
					key={action.id}
					label={action.label}
					icon={
						action.icon ? (
							<AppIcon icon={action.icon} size={20} />
						) : (
							<Text size="sm" fw={600}>
								{action.label.slice(0, 1)}
							</Text>
						)
					}
					expanded={expanded}
					onClick={() => runQuickAction(action)}
				/>
			))}
		</>
	);

	return (
		<Box
			style={{
				position: 'relative',
				width: START_MENU_SIDEBAR_WIDTH,
				flexShrink: 0,
				background: 'var(--mantine-color-dark-8)',
				borderRight: '1px solid var(--mantine-color-dark-5)',
			}}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
		>
			<Stack
				gap={4}
				p="xs"
				align="center"
				style={{ width: START_MENU_SIDEBAR_WIDTH, minHeight: '100%' }}
			>
				{items}
			</Stack>

			{expanded ? (
				<Box
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: START_MENU_SIDEBAR_EXPANDED_WIDTH,
						zIndex: 20,
						background: 'var(--mantine-color-dark-8)',
						borderRight: '1px solid var(--mantine-color-dark-5)',
						boxShadow: 'var(--mantine-shadow-xl)',
					}}
				>
					<Stack gap={4} p="xs">
						{items}
					</Stack>
				</Box>
			) : null}
		</Box>
	);
}

function PowerMenuButton({
	expanded,
	onCommand,
}: {
	expanded: boolean;
	onCommand: (command: StartMenuCommand) => void;
}) {
	const button = (
		<UnstyledButton
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				width: '100%',
				padding: expanded ? '8px 10px' : '8px 0',
				justifyContent: expanded ? 'flex-start' : 'center',
				borderRadius: 6,
				color: 'var(--mantine-color-gray-1)',
			}}
			styles={{
				root: {
					'&:hover': {
						background: 'var(--mantine-color-dark-6)',
					},
				},
			}}
		>
			<ActionIcon variant="transparent" color="gray" size={28} aria-hidden>
				<PowerIcon size={20} />
			</ActionIcon>
			{expanded ? (
				<Text size="sm" truncate>
					Питание
				</Text>
			) : null}
		</UnstyledButton>
	);

	const target = expanded ? button : (
		<Tooltip label="Питание" position="right" withArrow zIndex={1300}>
			{button}
		</Tooltip>
	);

	return (
		<Menu withinPortal position="right-start" offset={8} zIndex={1200}>
			<Menu.Target>{target}</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<ReloadIcon size={16} />} onClick={() => onCommand('reload')}>
					Перезагрузка
				</Menu.Item>
				<Menu.Item leftSection={<PowerIcon size={16} />} onClick={() => onCommand('logout')}>
					Выход
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

interface SidebarButtonProps {
	label: string;
	icon: ReactNode;
	expanded: boolean;
	onClick: () => void;
}

function SidebarButton({ label, icon, expanded, onClick }: SidebarButtonProps) {
	const button = (
		<UnstyledButton
			onClick={onClick}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				width: '100%',
				padding: expanded ? '8px 10px' : '8px 0',
				justifyContent: expanded ? 'flex-start' : 'center',
				borderRadius: 6,
				color: 'var(--mantine-color-gray-1)',
			}}
			styles={{
				root: {
					'&:hover': {
						background: 'var(--mantine-color-dark-6)',
					},
				},
			}}
		>
			<ActionIcon variant="transparent" color="gray" size={28} aria-hidden>
				{icon}
			</ActionIcon>
			{expanded ? (
				<Text size="sm" truncate>
					{label}
				</Text>
			) : null}
		</UnstyledButton>
	);

	if (expanded) {
		return button;
	}

	return (
		<Tooltip label={label} position="right" withArrow zIndex={1300}>
			{button}
		</Tooltip>
	);
}
