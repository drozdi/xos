import { Typography } from 'antd';
import { useMemo, type CSSProperties } from 'react';

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

const tileButtonStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: 6,
	padding: '10px 6px',
	borderRadius: 6,
	color: 'var(--xos-shell-text)',
	minHeight: 88,
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	width: '100%',
};

export function StartMenuTiles({ apps, onClose, onUnpin }: StartMenuTilesProps) {
	const launchApp = useAppManager((state) => state.launchApp);

	const handleLaunch = (appId: string) => {
		onClose();
		void launchApp(appId);
	};

	return (
		<div
			style={{
				width: START_MENU_TILES_WIDTH,
				flexShrink: 0,
				background: 'var(--xos-shell-bg)',
			}}
		>
			<div style={{ padding: '16px 16px 8px' }}>
				<Typography.Text type="secondary" strong style={{ fontSize: 13 }}>
					Быстрый доступ
				</Typography.Text>
			</div>
			<div style={{ height: 468, overflow: 'auto', paddingInline: 16, paddingBottom: 16 }}>
				{apps.length === 0 ? (
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						Добавьте приложения из списка через контекстное меню
					</Typography.Text>
				) : (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: 12,
						}}
					>
						{apps.map((app) => (
							<StartMenuTile
								key={app.id}
								app={app}
								onLaunch={handleLaunch}
								onUnpin={onUnpin}
							/>
						))}
					</div>
				)}
			</div>
		</div>
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
			<button
				type="button"
				onClick={() => onLaunch(app.id)}
				onContextMenu={onContextMenu}
				style={tileButtonStyle}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'var(--xos-shell-hover)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent';
				}}
			>
				<AppIcon icon={app.icon} size={28} />
				<Typography.Text
					style={{
						fontSize: 12,
						textAlign: 'center',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{app.name}
				</Typography.Text>
			</button>
			{menu}
		</>
	);
}
