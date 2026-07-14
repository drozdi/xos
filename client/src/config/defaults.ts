/** HKEY_CONFIG defaults — system-wide fallback values */
export const HKEY_CONFIG_DEFAULTS = {
	layout: {
		view: 'hhh lmr ffr',
		mobileView: 'h m f',
		panels: {
			left: { width: 280 },
			right: { width: 280 },
		},
	},
	window: {
		defaultWidth: 800,
		defaultHeight: 600,
		minWidth: 400,
		minHeight: 300,
	},
	taskbar: {
		height: 48,
	},
} as const;

export type HkeyConfigDefaults = typeof HKEY_CONFIG_DEFAULTS;
