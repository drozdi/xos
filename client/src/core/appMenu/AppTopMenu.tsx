import { Box } from '@mantine/core';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApiContext } from '@/core/context/CoreApiContext';

import { useAppMenuRuntime } from './AppMenuContext';
import { AppMenuDropdownBar, AppMenuToolbar } from './AppMenuViews';
import { groupMenuBarEntries, hasVisibleMenuEntries, resolveAppMenuItems } from './resolveMenuItems';
import type { AppMenuActionContext, AppMenuConfig, AppMenuEntry } from './types';
import { isAppMenuAction } from './types';

interface AppTopMenuProps {
	config?: AppMenuConfig;
}

function mergeMenuEntries(
	base: AppMenuEntry[],
	extra: AppMenuEntry[],
): AppMenuEntry[] {
	if (extra.length === 0) {
		return base;
	}
	if (base.length === 0) {
		return extra;
	}
	return [...base, { type: 'divider', id: 'runtime' }, ...extra];
}

function AppTopMenuContent({
	config,
	context,
	extraItems,
}: {
	config: AppMenuConfig;
	context: AppMenuActionContext;
	extraItems: AppMenuEntry[];
}) {
	const items = useMemo(() => {
		const resolved = resolveAppMenuItems(config.items, context);
		return mergeMenuEntries(resolved, extraItems);
	}, [config.items, context, extraItems]);

	const toolbarItems = useMemo(() => {
		if (!config.toolbarItems) {
			return items.filter(
				(entry) => isAppMenuAction(entry) && Boolean(entry.icon),
			);
		}
		return resolveAppMenuItems(config.toolbarItems, context);
	}, [config.toolbarItems, context, items]);

	if (config.component) {
		const CustomMenu = config.component;
		return <CustomMenu context={context} />;
	}

	if (!hasVisibleMenuEntries(items)) {
		return null;
	}

	const layout = config.layout ?? 'menu';

	if (layout === 'custom') {
		return null;
	}

	if (layout === 'toolbar') {
		return (
			<Box
				h={36}
				style={{
					flexShrink: 0,
					borderBottom: '1px solid var(--xos-window-titlebar-border)',
					background: 'var(--xos-window-titlebar-bg)',
					color: 'var(--xos-window-text)',
				}}
			>
				<AppMenuToolbar entries={items} context={context} />
			</Box>
		);
	}

	if (layout === 'combined') {
		const menuGroups = groupMenuBarEntries(items);
		return (
			<Box
				style={{
					flexShrink: 0,
					borderBottom: '1px solid var(--xos-window-titlebar-border)',
					background: 'var(--xos-window-titlebar-bg)',
					color: 'var(--xos-window-text)',
				}}
			>
				<Box h={28}>
					<AppMenuDropdownBar entries={menuGroups} context={context} />
				</Box>
				<Box
					h={36}
					style={{ borderTop: '1px solid var(--xos-window-titlebar-border)' }}
				>
					<AppMenuToolbar entries={toolbarItems} context={context} />
				</Box>
			</Box>
		);
	}

	return (
		<Box
			h={28}
			style={{
				flexShrink: 0,
				borderBottom: '1px solid var(--xos-window-titlebar-border)',
				background: 'var(--xos-window-titlebar-bg)',
				color: 'var(--xos-window-text)',
			}}
		>
			<AppMenuDropdownBar entries={groupMenuBarEntries(items)} context={context} />
		</Box>
	);
}

export function AppTopMenu({ config }: AppTopMenuProps) {
	const { appId, windowId, instanceKey } = useAppContext();
	const coreApi = useCoreApiContext();
	const { extraItems } = useAppMenuRuntime();

	const context = useMemo(
		() => ({ appId, windowId, instanceKey, coreApi }),
		[appId, coreApi, instanceKey, windowId],
	);

	if (!config) {
		return null;
	}

	return (
		<AppTopMenuContent
			config={config}
			context={context}
			extraItems={extraItems}
		/>
	);
}

interface AsyncAppTopMenuProps {
	loader: () => Promise<AppMenuConfig>;
}

function AsyncAppTopMenu({ loader }: AsyncAppTopMenuProps) {
	const { appId, windowId, instanceKey } = useAppContext();
	const coreApi = useCoreApiContext();
	const { extraItems } = useAppMenuRuntime();
	const [config, setConfig] = useState<AppMenuConfig | null>(null);

	useEffect(() => {
		let cancelled = false;
		void loader().then((loaded) => {
			if (!cancelled) {
				setConfig(loaded);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [loader]);

	const context = useMemo(
		() => ({ appId, windowId, instanceKey, coreApi }),
		[appId, coreApi, instanceKey, windowId],
	);

	if (!config) {
		return null;
	}

	return (
		<AppTopMenuContent
			config={config}
			context={context}
			extraItems={extraItems}
		/>
	);
}

interface AppTopMenuRootProps {
	config?: AppMenuConfig;
	loader?: () => Promise<AppMenuConfig>;
}

export function AppTopMenuRoot({ config, loader }: AppTopMenuRootProps) {
	if (loader) {
		return (
			<Suspense fallback={null}>
				<AsyncAppTopMenu loader={loader} />
			</Suspense>
		);
	}

	return <AppTopMenu config={config} />;
}
