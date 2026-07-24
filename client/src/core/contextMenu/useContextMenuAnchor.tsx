import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
	useCallback,
	useMemo,
	useState,
	type MouseEvent as ReactMouseEvent,
} from 'react';

import { getVisibleContextMenuItems } from './resolveMenuItems';
import type { ContextMenuContext, ContextMenuEntry, ContextMenuItemDef } from './types';
import { isContextMenuDivider } from './types';

interface UseContextMenuAnchorOptions {
	position?: 'bottom' | 'top';
	zIndex?: number;
}

export function useContextMenuAnchor(
	items: ContextMenuEntry[],
	context: ContextMenuContext,
	{ position = 'bottom', zIndex = 1200 }: UseContextMenuAnchorOptions = {},
) {
	const [opened, setOpened] = useState(false);
	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const visibleItems = useMemo(() => getVisibleContextMenuItems(items), [items]);
	const hasEntries = useMemo(
		() => items.some((entry) => isContextMenuDivider(entry) || !entry.hidden),
		[items],
	);

	const onContextMenu = useCallback(
		(event: ReactMouseEvent) => {
			if (!hasEntries || visibleItems.length === 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setAnchorPoint({ x: event.clientX, y: event.clientY });
			setOpened(true);
		},
		[hasEntries, visibleItems.length],
	);

	const handleItemClick = useCallback(
		(item: ContextMenuItemDef) => {
			setOpened(false);
			void item.onClick(context);
		},
		[context],
	);

	const menuItems: MenuProps['items'] = useMemo(() => {
		const result: NonNullable<MenuProps['items']> = [];
		items.forEach((entry, index) => {
			if (isContextMenuDivider(entry)) {
				result.push({ type: 'divider', key: entry.id ?? `divider-${index}` });
				return;
			}
			if (entry.hidden) {
				return;
			}
			result.push({
				key: entry.id,
				label: entry.label,
				icon: entry.icon ? <>{entry.icon}</> : undefined,
				disabled: entry.disabled,
				danger: entry.danger,
				onClick: () => handleItemClick(entry),
			});
		});
		return result;
	}, [handleItemClick, items]);

	const menu =
		hasEntries && visibleItems.length > 0 ? (
			<Dropdown
				open={opened}
				onOpenChange={setOpened}
				menu={{ items: menuItems }}
				trigger={['click']}
				placement={position === 'top' ? 'topLeft' : 'bottomLeft'}
				overlayStyle={{ zIndex }}
				getPopupContainer={() => document.body}
			>
				<span
					aria-hidden
					style={{
						position: 'fixed',
						left: anchorPoint.x,
						top: anchorPoint.y,
						width: 1,
						height: 1,
						pointerEvents: 'none',
					}}
				/>
			</Dropdown>
		) : null;

	return {
		onContextMenu,
		menu,
		hasContextMenu: hasEntries && visibleItems.length > 0,
	};
}
