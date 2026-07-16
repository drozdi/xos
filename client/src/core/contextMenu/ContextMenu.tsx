import { Box, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	useCallback,
	useMemo,
	useState,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
} from 'react';

import { getVisibleContextMenuItems } from './resolveMenuItems';
import type { ContextMenuContext, ContextMenuEntry, ContextMenuItemDef } from './types';
import { isContextMenuDivider, isContextMenuItem } from './types';

interface ContextMenuProps {
	items: ContextMenuEntry[];
	context: ContextMenuContext;
	children: ReactNode;
	position?: 'bottom' | 'top';
	zIndex?: number;
}

export function ContextMenu({
	items,
	context,
	children,
	position = 'bottom',
	zIndex = 1200,
}: ContextMenuProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const visibleItems = useMemo(() => getVisibleContextMenuItems(items), [items]);
	const hasEntries = useMemo(
		() => items.some((entry) => isContextMenuDivider(entry) || !entry.hidden),
		[items],
	);

	const handleContextMenu = useCallback(
		(event: ReactMouseEvent) => {
			if (!hasEntries || visibleItems.length === 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setAnchorPoint({ x: event.clientX, y: event.clientY });
			open();
		},
		[hasEntries, open, visibleItems.length],
	);

	const handleItemClick = useCallback(
		(item: ContextMenuItemDef) => (event: ReactMouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			close();
			void item.onClick(context);
		},
		[close, context],
	);

	if (!hasEntries || visibleItems.length === 0) {
		return <>{children}</>;
	}

	return (
		<>
			<Box component="span" style={{ display: 'contents' }} onContextMenu={handleContextMenu}>
				{children}
			</Box>
			<Menu
				opened={opened}
				onClose={close}
				position={position}
				offset={4}
				zIndex={zIndex}
				withinPortal
			>
				<Menu.Target>
					<Box
						style={{
							position: 'fixed',
							left: anchorPoint.x,
							top: anchorPoint.y,
							width: 1,
							height: 1,
							pointerEvents: 'none',
						}}
					/>
				</Menu.Target>
				<Menu.Dropdown>
					{items.map((entry, index) => {
						if (isContextMenuDivider(entry)) {
							return <Menu.Divider key={entry.id ?? `divider-${index}`} />;
						}
						if (entry.hidden) {
							return null;
						}

						return (
							<Menu.Item
								key={entry.id}
								leftSection={entry.icon}
								disabled={entry.disabled}
								color={entry.danger ? 'red' : undefined}
								onClick={handleItemClick(entry)}
							>
								{entry.label}
							</Menu.Item>
						);
					})}
				</Menu.Dropdown>
			</Menu>
		</>
	);
}
