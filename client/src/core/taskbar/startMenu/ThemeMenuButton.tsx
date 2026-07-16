import { ActionIcon, Popover, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';

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

export function ThemeMenuButton({ expanded }: ThemeMenuButtonProps) {
	const { theme, setTheme } = useThemePreference();

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
				<ThemeIcon theme={theme} />
			</ActionIcon>
			{expanded ? (
				<Text size="sm" truncate>
					Тема
				</Text>
			) : null}
		</UnstyledButton>
	);

	const target = expanded ? button : (
		<Tooltip label="Тема" position="right" withArrow zIndex={1300}>
			{button}
		</Tooltip>
	);

	return (
		<Popover position="right-start" offset={8} zIndex={2100} withinPortal>
			<Popover.Target>{target}</Popover.Target>
			<Popover.Dropdown p="xs">
				<Stack gap={4}>
					{THEME_OPTIONS.map((option) => (
						<UnstyledButton
							key={option.value}
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
							}}
							styles={{
								root: {
									'&:hover': {
										background: 'var(--xos-shell-hover)',
									},
								},
							}}
						>
							<option.icon size={16} />
							<Text size="sm">{option.label}</Text>
						</UnstyledButton>
					))}
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
