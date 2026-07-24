import { Flex, Popover, Tooltip, Typography } from 'antd';
import type { CSSProperties } from 'react';

import { useThemePreference, type ThemePreference } from '@/core/theme';

import { AutoThemeIcon, MoonIcon, SunIcon } from './startMenuIcons';

interface ThemeMenuButtonProps {
	expanded: boolean;
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof SunIcon }> = [
	{ value: 'light', label: 'Светлая', icon: SunIcon },
	{ value: 'dark', label: 'Тёмная', icon: MoonIcon },
	{ value: 'auto', label: 'Системная', icon: AutoThemeIcon },
];

function ThemeIcon({ theme }: { theme: ThemePreference }) {
	if (theme === 'light') {
		return <SunIcon size={20} />;
	}
	if (theme === 'auto') {
		return <AutoThemeIcon size={20} />;
	}
	return <MoonIcon size={20} />;
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

export function ThemeMenuButton({ expanded }: ThemeMenuButtonProps) {
	const { theme, setTheme } = useThemePreference();

	const button = (
		<button
			type="button"
			aria-label="Тема"
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
				<ThemeIcon theme={theme} />
			</span>
			{expanded ? (
				<Typography.Text ellipsis style={{ fontSize: 13 }}>
					Тема
				</Typography.Text>
			) : null}
		</button>
	);

	const target = expanded ? (
		button
	) : (
		<Tooltip title="Тема" placement="right">
			{button}
		</Tooltip>
	);

	return (
		<Popover
			placement="rightTop"
			trigger="click"
			overlayStyle={{ zIndex: 2100 }}
			content={
				<Flex vertical gap={4}>
					{THEME_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setTheme(option.value)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								width: '100%',
								padding: '8px 10px',
								borderRadius: 6,
								color: 'var(--xos-shell-text)',
								fontWeight: theme === option.value ? 600 : 400,
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
							<option.icon size={16} />
							<Typography.Text style={{ fontSize: 13 }}>{option.label}</Typography.Text>
						</button>
					))}
				</Flex>
			}
		>
			{target}
		</Popover>
	);
}
