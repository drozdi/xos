import { Flex, Typography } from 'antd';
import { useMemo, useState, type CSSProperties } from 'react';

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

const itemButtonStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 10,
	padding: '8px 10px',
	borderRadius: 4,
	color: 'var(--xos-shell-text)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	width: '100%',
	textAlign: 'left',
};

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
			<button
				type="button"
				onClick={() => onLaunch(appId)}
				onContextMenu={onContextMenu}
				style={{
					...itemButtonStyle,
					...(borderTop ? startMenuDividerStyle : {}),
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'var(--xos-shell-hover)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent';
				}}
			>
				<AppIcon icon={manifest.icon} size={18} />
				<Typography.Text style={{ fontSize: 13 }}>{name}</Typography.Text>
			</button>
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
		<div>
			<button
				type="button"
				onClick={() => setOpened((value) => !value)}
				aria-expanded={opened}
				aria-label={`${opened ? 'Свернуть' : 'Развернуть'} группу ${group.label}`}
				style={{
					width: '100%',
					padding: '6px 8px',
					borderRadius: 4,
					color: 'rgba(0, 0, 0, 0.45)',
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'var(--xos-shell-hover)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent';
				}}
			>
				<Flex gap={8} wrap="nowrap" align="center">
					<ChevronIcon size={18} expanded={opened} />
					<Typography.Text strong style={{ fontSize: 12, textTransform: 'uppercase' }}>
						{group.label}
					</Typography.Text>
					<Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
						{group.apps.length}
					</Typography.Text>
				</Flex>
			</button>
			{opened ? (
				<Flex vertical gap={2} style={{ paddingLeft: 8 }}>
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
				</Flex>
			) : null}
		</div>
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
		<div
			style={{
				flex: 1,
				minWidth: 0,
				borderRight: '1px solid var(--xos-shell-border)',
				background: 'var(--xos-shell-bg)',
			}}
		>
			<div style={{ padding: '16px 16px 8px' }}>
				<Typography.Text type="secondary" strong style={{ fontSize: 13 }}>
					Все приложения
				</Typography.Text>
			</div>
			<div
				style={{
					height: START_MENU_LIST_HEIGHT,
					overflow: 'auto',
					paddingInline: 12,
					paddingBottom: 16,
				}}
			>
				{groups.length === 0 ? (
					<Typography.Text type="secondary" style={{ fontSize: 13, padding: 16, display: 'block' }}>
						Нет доступных приложений
					</Typography.Text>
				) : (
					<Flex vertical gap="small">
						{groups.map((group) => (
							<GroupSection
								key={group.id}
								group={group}
								isPinned={isPinned}
								onLaunch={handleLaunch}
								onPin={onPin}
							/>
						))}
					</Flex>
				)}
			</div>
		</div>
	);
}

const START_MENU_LIST_HEIGHT = 468;
