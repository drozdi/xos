export type WindowAutoSizeMode = false | true | 'width' | 'height';

export type WindowPositionFixed = boolean | { x: number; y: number };

export interface WindowLayoutConfig {
	/** Разрешить изменение размера окна. По умолчанию true */
	resizable?: boolean;
	/** Запретить перемещение окна. true — текущая позиция; объект — фиксированные x/y */
	positionFixed?: WindowPositionFixed;
	/** Подстраивать размер окна под содержимое */
	autoSize?: WindowAutoSizeMode;
}

export interface ResolvedWindowLayoutConfig {
	resizable: boolean;
	positionFixed: boolean;
	autoSize: WindowAutoSizeMode;
}

export interface WindowLayoutBounds {
	minWidth: number;
	minHeight: number;
	maxWidth?: number;
	maxHeight?: number;
}

export function resolveWindowLayoutConfig(
	config?: WindowLayoutConfig | null,
): ResolvedWindowLayoutConfig {
	return {
		resizable: config?.resizable ?? true,
		positionFixed: Boolean(config?.positionFixed),
		autoSize: config?.autoSize ?? false,
	};
}

export function resolveInitialWindowPosition(
	config: WindowLayoutConfig | undefined,
	defaults: { x: number; y: number },
): { x: number; y: number; positionFixed: boolean } {
	if (
		config?.positionFixed &&
		typeof config.positionFixed === 'object'
	) {
		return {
			x: config.positionFixed.x,
			y: config.positionFixed.y,
			positionFixed: true,
		};
	}

	return {
		x: defaults.x,
		y: defaults.y,
		positionFixed: config?.positionFixed === true,
	};
}

export function clampWindowSize(
	width: number,
	height: number,
	bounds: WindowLayoutBounds,
): { width: number; height: number } {
	const nextWidth = Math.max(bounds.minWidth, width);
	const nextHeight = Math.max(bounds.minHeight, height);

	return {
		width: bounds.maxWidth ? Math.min(bounds.maxWidth, nextWidth) : nextWidth,
		height: bounds.maxHeight ? Math.min(bounds.maxHeight, nextHeight) : nextHeight,
	};
}
