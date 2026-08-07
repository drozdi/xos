import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppManager } from '@/core/appManager/useAppManager';

import { useExplorerLaunchStore } from './explorerLaunchStore';

export interface ExplorerFileAssociation {
	appId: string;
	label: string;
	fileTypes: string[];
	extensions?: string[];
	contextMenuLabel?: string;
}

const associations: ExplorerFileAssociation[] = [];

export function registerExplorerFileAssociation(association: ExplorerFileAssociation) {
	if (associations.some((item) => item.appId === association.appId)) {
		return;
	}
	associations.push(association);
}

export function getExplorerAssociations() {
	return associations;
}

export function getOpenWithAppsForEntry(entry: {
	fileType?: string;
	extension?: string | null;
	openWith?: string[];
}) {
	const fromServer = entry.openWith ?? [];
	const fromRegistry = associations
		.filter((item) => {
			if (entry.fileType && item.fileTypes.includes(entry.fileType)) {
				return true;
			}
			if (entry.extension && item.extensions?.includes(entry.extension)) {
				return true;
			}
			return false;
		})
		.map((item) => item.appId);

	return [...new Set([...fromServer, ...fromRegistry])];
}

export function getAssociationLabel(appId: string) {
	return associations.find((item) => item.appId === appId)?.label ?? appId;
}

export async function openVfsPathWithApp(appId: string, vfsPath: string, title?: string) {
	const windowTitle = title ?? vfsPath.split('/').pop() ?? appId;
	const manager = useAppManager.getState();
	const manifest = manager.registry.get(appId) ?? AppRegistry.get(appId);

	if (manifest?.singleInstance) {
		useExplorerLaunchStore.getState().setOpenRequest({ appId, vfsPath });
		await manager.launchApp(appId, {
			instanceKey: 'default',
			title: windowTitle,
		});
		return;
	}

	/** Multi satellites: always new window; path via props (no launch-store steal). */
	const instanceKey = crypto.randomUUID();
	await manager.launchApp(appId, {
		instanceKey,
		title: windowTitle,
		props: { documentPath: vfsPath },
	});
}
