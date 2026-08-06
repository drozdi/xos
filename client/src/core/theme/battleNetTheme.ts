import {
	Button,
	createTheme,
	Input,
	Paper,
	type CSSVariablesResolver,
	type MantineColorsTuple,
} from '@mantine/core';

/**
 * Dark palette aligned with blizzard.com design tokens
 * (page/surface #151c28, accent ~#0592ff).
 * @see https://www.blizzard.com/ru-ru/
 */
export const BATTLE_NET = {
	bg: '#151c28',
	surface: '#151c28',
	surfaceMuted: '#1b2433',
	surfaceHover: '#232a39',
	border: '#323a48',
	accent: '#0592ff',
	accentHover: '#3aa6ff',
	text: 'rgba(255, 255, 255, 0.9)',
	textMuted: 'rgba(255, 255, 255, 0.5)',
	selectionBg: 'rgba(5, 146, 255, 0.35)',
	accentLight: 'rgba(5, 146, 255, 0.12)',
	accentLightHover: 'rgba(5, 146, 255, 0.18)',
	windowShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
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
	BATTLE_NET.bg,
	'#0a0d15',
];

const battleNetBlue: MantineColorsTuple = [
	'#e8f4ff',
	'#cce7ff',
	'#99cfff',
	'#66b7ff',
	'#33a0ff',
	'#1a82ff',
	BATTLE_NET.accent,
	'#0480e0',
	'#0366b3',
	'#024d86',
];

const battleNetDark: MantineColorsTuple = [
	'#e8eaed',
	'#b8bcc4',
	'#9aa0ab',
	'#6b7280',
	BATTLE_NET.border,
	BATTLE_NET.surfaceHover,
	BATTLE_NET.surfaceMuted,
	BATTLE_NET.bg,
	'#0a0d15',
	'#05070c',
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
