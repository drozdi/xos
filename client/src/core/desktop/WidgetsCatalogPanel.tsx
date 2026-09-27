import { Checkbox, Stack, Text } from '@mantine/core';
import { useCallback } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import {
	DESKTOP_WIDGETS_SETTING_KEY,
	isWidgetEnabled,
	normalizeDesktopWidgets,
	toggleDesktopWidget,
	type DesktopWidgetEntry,
} from '@/core/desktop/desktopWidgets';
import { useSetting } from '@/core/settings/hooks';

/** Shared catalog UI for shell-settings and other hosts. */
export function WidgetsCatalogPanel() {
	const [catalog, setCatalog] = useSetting<DesktopWidgetEntry[]>(
		'USER',
		DESKTOP_WIDGETS_SETTING_KEY,
		[],
	);
	const entries = normalizeDesktopWidgets(catalog);
	const widgets = AppRegistry.getWidgets();

	const handleToggle = useCallback(
		async (appId: string) => {
			const enabled = await toggleDesktopWidget(appId, 'default');
			const next = normalizeDesktopWidgets(catalog);
			const without = next.filter((e) => !(e.appId === appId && e.instanceKey === 'default'));
			without.push({ appId, instanceKey: 'default', enabled });
			setCatalog(without);
		},
		[catalog, setCatalog],
	);

	if (widgets.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет зарегистрированных виджетов.
			</Text>
		);
	}

	return (
		<Stack gap="xs">
			<Text size="sm" c="dimmed">
				Виджеты появляются на рабочем столе (без кнопки на панели задач). ПКМ по столу —
				тот же список.
			</Text>
			{widgets.map((manifest) => {
				const checked = isWidgetEnabled(entries, manifest.id);
				return (
					<Checkbox
						key={manifest.id}
						label={manifest.name}
						description={manifest.widgetDescription}
						checked={checked}
						onChange={() => {
							void handleToggle(manifest.id);
						}}
					/>
				);
			})}
		</Stack>
	);
}
