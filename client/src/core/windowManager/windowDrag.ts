import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

/** Класс заголовка окна — зона перетаскивания по умолчанию */
export const XOS_WINDOW_TITLEBAR_CLASS = 'xos-window-titlebar';

/** Маркер зоны перетаскивания (добавляйте на кастомные области) */
export const XOS_WINDOW_DRAG_HANDLE_CLASS = 'xos-window-drag-handle';

/** Маркер зоны, где перетаскивание запрещено (приоритет над dragHandles) */
export const XOS_WINDOW_NO_DRAG_CLASS = 'xos-window-no-drag';

export interface WindowDragConfig {
	/** CSS-селекторы зон перетаскивания. По умолчанию — заголовок */
	dragHandles?: string[];
	/** CSS-селекторы зон без перетаскивания (приоритет над dragHandles) */
	dragCancel?: string[];
}

export interface ResolvedWindowDragConfig {
	dragHandles: string[];
	dragCancel: string[];
}

const { defaultDragHandles, defaultDragCancel } = HKEY_CONFIG_DEFAULTS.window;

export function resolveWindowDragConfig(
	config?: WindowDragConfig | null,
): ResolvedWindowDragConfig {
	return {
		dragHandles: config?.dragHandles ?? [...defaultDragHandles],
		dragCancel: config?.dragCancel ?? [...defaultDragCancel],
	};
}

export function buildDragCancelSelector(dragCancel: string[]): string | undefined {
	const selector = dragCancel.filter(Boolean).join(', ');
	return selector || undefined;
}
