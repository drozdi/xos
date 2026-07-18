import type { ContextMenuEntry } from '@/core/contextMenu/types';

import type { ExplorerEntry } from '../explorerApi';
import { canArchiveExplorer, canDeleteExplorer, canWriteExplorer } from '../explorerAccess';
import { getAssociationLabel, getExplorerAssociations, getOpenWithAppsForEntry } from '../openWithRegistry';

export interface ExplorerMenuContext {
	selectedPaths: string[];
	selectedEntries: ExplorerEntry[];
	currentPath: string;
	isTrashView: boolean;
	readOnly: boolean;
	actions: {
		open: (entry: ExplorerEntry) => void | Promise<void>;
		copy: () => void;
		cut: () => void;
		paste: () => void;
		delete: () => void;
		rename: () => void;
		pack: () => void;
		unpack: () => void;
		restore: () => void;
		emptyTrash: () => void;
		openWith: (appId: string, path: string, name: string) => void | Promise<void>;
	};
}

export function buildExplorerMenuItems(context: ExplorerMenuContext): ContextMenuEntry[] {
	const { selectedEntries, isTrashView, readOnly, actions } = context;
	const canWrite = canWriteExplorer() && !readOnly;
	const canDelete = canDeleteExplorer();
	const canArchive = canArchiveExplorer();
	const singleEntry = selectedEntries.length === 1 ? selectedEntries[0] : null;
	const openWithApps = singleEntry ? getOpenWithAppsForEntry(singleEntry) : [];

	const items: ContextMenuEntry[] = [];

	if (!isTrashView && singleEntry) {
		items.push({
			id: 'open',
			label: singleEntry.type === 'folder' ? 'Открыть' : 'Открыть',
			onClick: () => void actions.open(singleEntry),
		});

		for (const appId of openWithApps) {
			const association = getExplorerAssociations().find((item) => item.appId === appId);
			const path = singleEntry.path ?? context.selectedPaths[0] ?? '';
			items.push({
				id: `open-with-${appId}`,
				label: association?.contextMenuLabel ?? getAssociationLabel(appId),
				onClick: () => void actions.openWith(appId, path, singleEntry.name),
			});
		}
	}

	if (!isTrashView && canWrite) {
		items.push({ type: 'divider', id: 'edit-divider' });
		items.push({
			id: 'copy',
			label: 'Копировать',
			disabled: context.selectedPaths.length === 0,
			onClick: () => actions.copy(),
		});
		items.push({
			id: 'cut',
			label: 'Вырезать',
			disabled: context.selectedPaths.length === 0,
			onClick: () => actions.cut(),
		});
		items.push({
			id: 'paste',
			label: 'Вставить',
			onClick: () => actions.paste(),
		});
		items.push({
			id: 'rename',
			label: 'Переименовать',
			disabled: context.selectedPaths.length !== 1,
			onClick: () => actions.rename(),
		});
	}

	if (!isTrashView && canArchive) {
		items.push({ type: 'divider', id: 'archive-divider' });
		items.push({
			id: 'pack',
			label: 'Создать ZIP',
			disabled: context.selectedPaths.length === 0,
			onClick: () => actions.pack(),
		});
		if (singleEntry?.fileType === 'archive' || singleEntry?.extension === 'zip') {
			items.push({
				id: 'unpack',
				label: 'Распаковать',
				onClick: () => actions.unpack(),
			});
		}
	}

	if (!isTrashView && canDelete) {
		items.push({ type: 'divider', id: 'delete-divider' });
		items.push({
			id: 'delete',
			label: 'Удалить',
			danger: true,
			disabled: context.selectedPaths.length === 0,
			onClick: () => actions.delete(),
		});
	}

	if (isTrashView && canDelete) {
		items.push({
			id: 'restore',
			label: 'Восстановить',
			disabled: context.selectedPaths.length === 0,
			onClick: () => actions.restore(),
		});
		items.push({
			id: 'empty-trash',
			label: 'Очистить корзину',
			danger: true,
			onClick: () => actions.emptyTrash(),
		});
	}

	return items;
}
