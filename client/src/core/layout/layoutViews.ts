import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

/** Предустановленные строки макета для parseView (h=header, m=main, f=footer, l/r=panels) */
export const LAYOUT_VIEWS = {
	desktop: HKEY_CONFIG_DEFAULTS.layout.view,
	mobile: HKEY_CONFIG_DEFAULTS.layout.mobileView,
	withPanels: HKEY_CONFIG_DEFAULTS.layout.panelView,
} as const;
