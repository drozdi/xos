/** HKEY_CONFIG defaults — system-wide fallback values */
export const HKEY_CONFIG_DEFAULTS = {
	layout: {
		/** Desktop shell: header + main + taskbar, без боковых панелей */
		view: 'h m f',
		mobileView: 'h m f',
		/** Макет с resizable left/main/right — для экранов с панелями */
		panelView: 'hhh lmr fff',
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
		/** Минимальная видимая часть окна у края рабочей области (px) */
		dragMargin: 50,
	},
	taskbar: {
		height: 48,
	},
} as const;

export type HkeyConfigDefaults = typeof HKEY_CONFIG_DEFAULTS;
