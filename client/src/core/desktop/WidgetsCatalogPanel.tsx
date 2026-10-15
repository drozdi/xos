import { Button, Checkbox, Group, Stack, Text } from '@mantine/core';
import { useCallback } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import {
	DESKTOP_PAGE_COUNT,
	DESKTOP_PAGE_KEY,
	DESKTOP_WIDGET_SNAP_KEY,
	DESKTOP_WIDGETS_SETTING_KEY,
	isWidgetEnabled,
	normalizeDesktopWidgets,
	switchDesktopPage,
	toggleDesktopWidget,
	type DesktopWidgetEntry,
} from '@/core/desktop/desktopWidgets';
import { useSetting } from '@/core/settings/hooks';

const EMPTY_WIDGETS: DesktopWidgetEntry[] = [];

/** Shared catalog UI for shell-settings and other hosts. */
export function WidgetsCatalogPanel() {
	const [catalog, setCatalog] = useSetting<DesktopWidgetEntry[]>(
		'USER',
		DESKTOP_WIDGETS_SETTING_KEY,
		EMPTY_WIDGETS,
	);
	const entries = normalizeDesktopWidgets(catalog);
	const widgets = AppRegistry.getWidgets();
	const [snap, setSnap] = useSetting<boolean>('USER', DESKTOP_WIDGET_SNAP_KEY, false);
	const [page, setPage] = useSetting<number>('USER', DESKTOP_PAGE_KEY, 0);

	const handleToggle = useCallback(
		async (appId: string) => {
			const enabled = await toggleDesktopWidget(appId, 'default');
			const next = normalizeDesktopWidgets(catalog);
			const without = next.filter((e) => !(e.appId === appId && e.instanceKey === 'default'));
			const prev = next.find((e) => e.appId === appId && e.instanceKey === 'default');
			without.push({ appId, instanceKey: 'default', enabled, page: prev?.page ?? (page ?? 0) });
			setCatalog(without);
		},
		[catalog, page, setCatalog],
	);

	return (
		<Stack gap="xs">
			<Group gap={4}>
				<Text size="xs" c="dimmed">
					Стол
				</Text>
				{Array.from({ length: DESKTOP_PAGE_COUNT }, (_, index) => (
					<Button
						key={index}
						size="compact-xs"
						variant={(page ?? 0) === index ? 'filled' : 'default'}
						onClick={() => {
							setPage(index);
							void switchDesktopPage(index);
						}}
					>
						{index + 1}
					</Button>
				))}
				<Text size="xs" c="dimmed">
					Ctrl+Alt+←/→
				</Text>
			</Group>
			<Checkbox
				label="Привязка к сетке 16px"
				checked={snap === true}
				onChange={(event) => setSnap(event.currentTarget.checked)}
			/>
			{widgets.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет зарегистрированных виджетов.
				</Text>
			) : (
				<Text size="sm" c="dimmed">
					Виджеты появляются на рабочем столе (без кнопки на панели задач). ПКМ по столу —
					тот же список.
				</Text>
			)}
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
