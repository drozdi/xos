import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';

import { isContextMenuDivider } from '@/core/contextMenu/types';

import { buildExplorerMenuItems, type ExplorerMenuContext } from '../contextMenu/explorerMenuItems';

export function useExplorerContextMenu(context: ExplorerMenuContext) {
	const [opened, setOpened] = useState(false);
	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const items = useMemo(() => buildExplorerMenuItems(context), [context]);

	const onContextMenu = useCallback(
		(event: ReactMouseEvent) => {
			if (items.length === 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setAnchorPoint({ x: event.clientX, y: event.clientY });
			setOpened(true);
		},
		[items.length],
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
				disabled: entry.disabled,
				danger: entry.danger,
				onClick: () => {
					setOpened(false);
					void entry.onClick({} as never);
				},
			});
		});
		return result;
	}, [items]);

	const menu = (
		<Dropdown
			open={opened}
			onOpenChange={setOpened}
			menu={{ items: menuItems }}
			trigger={['click']}
			placement="bottomLeft"
			overlayStyle={{ zIndex: 1300 }}
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
	);

	return { onContextMenu, menu };
}
