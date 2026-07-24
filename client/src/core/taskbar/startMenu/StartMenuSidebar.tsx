import { Dropdown, Flex, Tooltip, Typography } from 'antd';
import { useState, type CSSProperties, type ReactNode } from 'react';

import { useAppManager } from '@/core/appManager/useAppManager';
import { useAuthStore } from '@/core/auth/authStore';

import {
	START_MENU_SIDEBAR_EXPANDED_WIDTH,
	START_MENU_SIDEBAR_WIDTH,
} from './defaults';
import { PowerIcon, ReloadIcon } from './startMenuIcons';
import { ThemeMenuButton } from './ThemeMenuButton';
import type { StartMenuCommand } from './types';

interface StartMenuSidebarProps {
	onClose: () => void;
}

const hoverButtonStyle = (expanded: boolean): CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 10,
	width: '100%',
	padding: expanded ? '8px 10px' : '8px 0',
	justifyContent: expanded ? 'flex-start' : 'center',
	borderRadius: 6,
	color: 'var(--xos-shell-text)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
});

export function StartMenuSidebar({ onClose }: StartMenuSidebarProps) {
	const [expanded, setExpanded] = useState(false);
	const launchApp = useAppManager((state) => state.launchApp);
	const logout = useAuthStore((state) => state.logout);
	const authUser = useAuthStore((state) => state.user);
	const userLabel = authUser?.alias ?? authUser?.login ?? 'Пользователь';
	const userInitial = userLabel.charAt(0).toUpperCase();

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
		<Flex
			vertical
			justify="space-between"
			gap={0}
			style={{
				width: isExpanded ? START_MENU_SIDEBAR_EXPANDED_WIDTH : START_MENU_SIDEBAR_WIDTH,
				minHeight: '100%',
			}}
		>
			<Flex vertical gap={4} style={{ padding: 8 }} align="center">
				<ThemeMenuButton expanded={isExpanded} />
			</Flex>

			<Flex
				vertical
				gap={4}
				align="center"
				style={{ padding: 8, borderTop: '1px solid var(--xos-shell-border)' }}
			>
				<SidebarButton
					label={userLabel}
					icon={
						<Typography.Text strong style={{ fontSize: 13 }}>
							{userInitial}
						</Typography.Text>
					}
					expanded={isExpanded}
					onClick={() => runCommand('settings')}
				/>
				<ShutdownMenuButton expanded={isExpanded} onCommand={runCommand} />
			</Flex>
		</Flex>
	);

	return (
		<div
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
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: START_MENU_SIDEBAR_EXPANDED_WIDTH,
						zIndex: 20,
						background: 'var(--xos-shell-bg-elevated)',
						borderRight: '1px solid var(--xos-shell-border)',
						boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
					}}
				>
					{content(true)}
				</div>
			) : null}
		</div>
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
		<button
			type="button"
			style={hoverButtonStyle(expanded)}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = 'var(--xos-shell-hover)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = 'transparent';
			}}
		>
			<span
				aria-hidden
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 28,
					height: 28,
					flexShrink: 0,
				}}
			>
				<PowerIcon size={20} />
			</span>
			{expanded ? (
				<Typography.Text ellipsis style={{ fontSize: 13 }}>
					Выключение
				</Typography.Text>
			) : null}
		</button>
	);

	const target = expanded ? (
		button
	) : (
		<Tooltip title="Выключение" placement="right">
			{button}
		</Tooltip>
	);

	return (
		<Dropdown
			menu={{
				items: [
					{
						key: 'reload',
						icon: <ReloadIcon size={16} />,
						label: 'Перезагрузить',
						onClick: () => onCommand('reload'),
					},
					{
						key: 'logout',
						icon: <PowerIcon size={16} />,
						label: 'Выйти',
						onClick: () => onCommand('logout'),
					},
				],
			}}
			trigger={['click']}
			placement="topRight"
			overlayStyle={{ zIndex: 2100 }}
		>
			{target}
		</Dropdown>
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
		<button
			type="button"
			onClick={onClick}
			style={hoverButtonStyle(expanded)}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = 'var(--xos-shell-hover)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = 'transparent';
			}}
		>
			<span
				aria-hidden
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 28,
					height: 28,
					flexShrink: 0,
				}}
			>
				{icon}
			</span>
			{expanded ? (
				<Typography.Text ellipsis style={{ fontSize: 13 }}>
					{label}
				</Typography.Text>
			) : null}
		</button>
	);

	if (expanded) {
		return button;
	}

	return (
		<Tooltip title={label} placement="right">
			{button}
		</Tooltip>
	);
}
