import { ActionIcon, Box, Menu, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useState, type ReactNode } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppManager } from '@/core/appManager/useAppManager';
import { useAuthStore } from '@/core/auth/authStore';

import { AppIcon } from '../taskbarUtils';
import {
	START_MENU_SIDEBAR_EXPANDED_WIDTH,
	START_MENU_SIDEBAR_WIDTH,
} from './defaults';
import { PowerIcon, ReloadIcon, SettingsIcon } from './startMenuIcons';
import { ThemeMenuButton } from './ThemeMenuButton';
import type { StartMenuCommand } from './types';

interface StartMenuSidebarProps {
	onClose: () => void;
}

export function StartMenuSidebar({ onClose }: StartMenuSidebarProps) {
	const [expanded, setExpanded] = useState(false);
	const launchApp = useAppManager((state) => state.launchApp);
	const logout = useAuthStore((state) => state.logout);
	const usersApp = AppRegistry.get('users');

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

	const content = (isExpanded: boolean) => (
		<Stack
			justify="space-between"
			gap={0}
			style={{ width: isExpanded ? START_MENU_SIDEBAR_EXPANDED_WIDTH : START_MENU_SIDEBAR_WIDTH, minHeight: '100%' }}
		>
			<Stack gap={4} p="xs" align="center">
				<ThemeMenuButton expanded={isExpanded} />
			</Stack>

			<Stack
				gap={4}
				p="xs"
				align="center"
				style={{ borderTop: '1px solid var(--xos-shell-border)' }}
			>
				<SidebarButton
					label="Параметры"
					icon={<SettingsIcon size={20} />}
					expanded={isExpanded}
					onClick={() => runCommand('settings')}
				/>
				<SidebarButton
					label="Пользователь"
					icon={
						usersApp?.icon ? (
							<AppIcon icon={usersApp.icon} size={20} />
						) : (
							<Text size="sm" fw={600}>
								П
							</Text>
						)
					}
					expanded={isExpanded}
					onClick={() => {
						onClose();
						void launchApp('users');
					}}
				/>
				<ShutdownMenuButton expanded={isExpanded} onCommand={runCommand} />
			</Stack>
		</Stack>
	);

	return (
		<Box
			style={{
				position: 'relative',
				width: START_MENU_SIDEBAR_WIDTH,
				flexShrink: 0,
				background: 'var(--xos-shell-bg-elevated)',
				borderRight: '1px solid var(--xos-shell-border)',
			}}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
		>
			{content(false)}

			{expanded ? (
				<Box
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: START_MENU_SIDEBAR_EXPANDED_WIDTH,
						zIndex: 20,
						background: 'var(--xos-shell-bg-elevated)',
						borderRight: '1px solid var(--xos-shell-border)',
						boxShadow: 'var(--mantine-shadow-xl)',
					}}
				>
					{content(true)}
				</Box>
			) : null}
		</Box>
	);
}

function ShutdownMenuButton({
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
				color: 'var(--xos-shell-text)',
			}}
			styles={{
				root: {
					'&:hover': {
						background: 'var(--xos-shell-hover)',
					},
				},
			}}
		>
			<ActionIcon variant="transparent" color="gray" size={28} aria-hidden>
				<PowerIcon size={20} />
			</ActionIcon>
			{expanded ? (
				<Text size="sm" truncate>
					Выключение
				</Text>
			) : null}
		</UnstyledButton>
	);

	const target = expanded ? button : (
		<Tooltip label="Выключение" position="right" withArrow zIndex={1300}>
			{button}
		</Tooltip>
	);

	return (
		<Menu withinPortal position="right-start" offset={8} zIndex={2100}>
			<Menu.Target>{target}</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<ReloadIcon size={16} />} onClick={() => onCommand('reload')}>
					Перезагрузить
				</Menu.Item>
				<Menu.Item leftSection={<PowerIcon size={16} />} onClick={() => onCommand('logout')}>
					Выйти
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
				color: 'var(--xos-shell-text)',
			}}
			styles={{
				root: {
					'&:hover': {
						background: 'var(--xos-shell-hover)',
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
