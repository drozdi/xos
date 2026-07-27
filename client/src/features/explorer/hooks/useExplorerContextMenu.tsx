import { Box, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';

import { isContextMenuDivider } from '@/core/contextMenu/types';

import { buildExplorerMenuItems, type ExplorerMenuContext } from '../contextMenu/explorerMenuItems';

export function useExplorerContextMenu(context: ExplorerMenuContext) {
	const [opened, { open, close }] = useDisclosure(false);
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
			open();
		},
		[items.length, open],
	);

	const menu = (
		<Menu opened={opened} onClose={close} position="bottom-start" withinPortal zIndex={1300}>
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
							disabled={entry.disabled}
							color={entry.danger ? 'red' : undefined}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								close();
								void entry.onClick({} as never);
							}}
						>
							{entry.label}
						</Menu.Item>
					);
				})}
			</Menu.Dropdown>
		</Menu>
	);

	return { onContextMenu, menu };
}
