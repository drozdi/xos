import type { ReactNode } from 'react';

import { ContextMenu } from './ContextMenu';
import { useAppContextMenuContext, useAppWindowContextMenu } from './useContextMenuItems';
import type { ContextMenuEntry } from './types';

interface AppContextMenuProps {
	children: ReactNode;
	extraItems?: ContextMenuEntry[];
}

/** Контекстное меню внутри приложения — базовые пункты + manifest + локальные extraItems */
export function AppContextMenu({ children, extraItems }: AppContextMenuProps) {
	const items = useAppWindowContextMenu(extraItems);
	const context = useAppContextMenuContext();

	return (
		<ContextMenu items={items} context={context}>
			{children}
		</ContextMenu>
	);
}
