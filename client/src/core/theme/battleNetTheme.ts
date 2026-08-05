import {
	Button,
	createTheme,
	Input,
	Paper,
	type CSSVariablesResolver,
	type MantineColorsTuple,
} from '@mantine/core';

/** Battle.net Shop — eu.shop.battle.net */
export const BATTLE_NET = {
	bg: '#15171e',
	surface: '#191b21',
	surfaceMuted: '#1e2128',
	surfaceHover: '#252830',
	border: '#2d3139',
	accent: '#148eff',
	accentHover: '#4da3ff',
	text: 'rgba(255, 255, 255, 0.92)',
	textMuted: 'rgba(255, 255, 255, 0.55)',
	selectionBg: 'rgba(20, 142, 255, 0.35)',
	accentLight: 'rgba(20, 142, 255, 0.12)',
	accentLightHover: 'rgba(20, 142, 255, 0.18)',
	windowShadow: '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04)',
	windowShadowLight: '0 8px 24px rgba(0, 0, 0, 0.12)',
} as const;

const battleNetGray: MantineColorsTuple = [
	'#f5f6f8',
	'#e8eaed',
	'#d1d5db',
	'#9aa0ab',
	'#6b7280',
	BATTLE_NET.border,
	BATTLE_NET.surfaceHover,
	BATTLE_NET.surfaceMuted,
	BATTLE_NET.surface,
	BATTLE_NET.bg,
];

const battleNetBlue: MantineColorsTuple = [
	'#e8f4ff',
	'#cce7ff',
	'#99cfff',
	'#66b7ff',
	'#33a0ff',
	'#1a82ff',
	BATTLE_NET.accent,
	'#1178d4',
	'#0e62aa',
	'#0a4c80',
];

const battleNetDark: MantineColorsTuple = [
	'#e8eaed',
	'#b8bcc4',
	'#9aa0ab',
	'#6b7280',
	BATTLE_NET.border,
	BATTLE_NET.surfaceHover,
	BATTLE_NET.surfaceMuted,
	BATTLE_NET.surface,
	BATTLE_NET.bg,
	'#0d0f14',
];

export function createBattleNetTheme() {
	return createTheme({
		primaryColor: 'blue',
		fontFamily:
			'"Segoe UI", "Helvetica Neue", Helvetica, Arial, "Inter", system-ui, sans-serif',
		defaultRadius: 'md',
		colors: {
			blue: battleNetBlue,
			dark: battleNetDark,
			gray: battleNetGray,
		},
		shadows: {
			md: BATTLE_NET.windowShadow,
		},
		other: {
			battleNet: BATTLE_NET,
		},
		components: {
			Button: Button.extend({
				defaultProps: {
					radius: 'md',
				},
				styles: {
					root: {
						fontWeight: 500,
					},
				},
			}),
			Input: Input.extend({
				defaultProps: {
					radius: 'sm',
				},
				styles: {
					input: {
						backgroundColor: 'var(--mantine-color-default)',
						borderColor: 'var(--mantine-color-default-border)',
						'&:focus': {
							borderColor: 'var(--mantine-primary-color-filled)',
						},
					},
				},
			}),
			Paper: Paper.extend({
				defaultProps: {
					radius: 'md',
					withBorder: true,
				},
				styles: {
					root: {
						backgroundColor: 'var(--mantine-color-default)',
						borderColor: 'var(--mantine-color-default-border)',
					},
				},
			}),
		},
	});
}

export const battleNetCssVariablesResolver: CSSVariablesResolver = () => ({
	variables: {},
	light: {},
	dark: {
		'--mantine-color-body': BATTLE_NET.bg,
		'--mantine-color-default': BATTLE_NET.surface,
		'--mantine-color-default-hover': BATTLE_NET.surfaceHover,
		'--mantine-color-default-border': BATTLE_NET.border,
		'--mantine-color-default-color': BATTLE_NET.text,
		'--mantine-color-text': BATTLE_NET.text,
		'--mantine-color-dimmed': BATTLE_NET.textMuted,
		'--mantine-color-bright': '#ffffff',
		'--mantine-color-placeholder': BATTLE_NET.textMuted,
		'--mantine-color-anchor': BATTLE_NET.accent,
		'--mantine-color-filled': BATTLE_NET.accent,
		'--mantine-color-filled-hover': BATTLE_NET.accentHover,
		'--mantine-primary-color-filled': BATTLE_NET.accent,
		'--mantine-primary-color-filled-hover': BATTLE_NET.accentHover,
		'--mantine-primary-color-light': BATTLE_NET.accentLight,
		'--mantine-primary-color-light-hover': BATTLE_NET.accentLightHover,
		'--mantine-primary-color-light-color': BATTLE_NET.accent,
		'--mantine-color-blue-light': BATTLE_NET.accentLight,
		'--mantine-color-blue-light-hover': BATTLE_NET.accentLightHover,
		'--mantine-color-blue-light-color': BATTLE_NET.accent,
		'--mantine-color-disabled': BATTLE_NET.surfaceMuted,
		'--mantine-color-disabled-color': BATTLE_NET.textMuted,
		'--mantine-color-disabled-border': BATTLE_NET.border,
	},
});
