import { Box, Checkbox, Menu, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import {
	DESKTOP_WIDGETS_SETTING_KEY,
	isWidgetEnabled,
	normalizeDesktopWidgets,
	toggleDesktopWidget,
	type DesktopWidgetEntry,
} from '@/core/desktop/desktopWidgets';
import { useSetting } from '@/core/settings/hooks';

const EMPTY_WIDGETS: DesktopWidgetEntry[] = [];

/**
 * Full-area desktop layer under WM windows. RMB → widget catalog toggles.
 */
export function DesktopSurface() {
	const [catalog, setCatalog] = useSetting<DesktopWidgetEntry[]>(
		'USER',
		DESKTOP_WIDGETS_SETTING_KEY,
		EMPTY_WIDGETS,
	);
	const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
	const entries = normalizeDesktopWidgets(catalog);
	const widgets = AppRegistry.getWidgets();

	useEffect(() => {
		if (!menuPos) {
			return;
		}
		const close = () => setMenuPos(null);
		window.addEventListener('click', close);
		window.addEventListener('blur', close);
		return () => {
			window.removeEventListener('click', close);
			window.removeEventListener('blur', close);
		};
	}, [menuPos]);

	const handleContextMenu = useCallback((event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setMenuPos({ x: event.clientX, y: event.clientY });
	}, []);

	const handleToggle = useCallback(
		async (appId: string) => {
			const enabled = await toggleDesktopWidget(appId, 'default');
			const next = normalizeDesktopWidgets(catalog);
			const without = next.filter((e) => !(e.appId === appId && e.instanceKey === 'default'));
			const prev = next.find((e) => e.appId === appId && e.instanceKey === 'default');
			without.push({ appId, instanceKey: 'default', enabled, page: prev?.page ?? 0 });
			setCatalog(without);
		},
		[catalog, setCatalog],
	);

	return (
		<>
			<Box
				data-xos-desktop-surface
				onContextMenu={handleContextMenu}
				style={{
					position: 'absolute',
					inset: 0,
					zIndex: 0,
					pointerEvents: 'auto',
				}}
			/>
			{menuPos ? (
				<Menu opened onClose={() => setMenuPos(null)} position="bottom-start" withinPortal>
					<Menu.Target>
						<Box
							style={{
								position: 'fixed',
								left: menuPos.x,
								top: menuPos.y,
								width: 1,
								height: 1,
								pointerEvents: 'none',
							}}
						/>
					</Menu.Target>
					<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
						<Menu.Label>Виджеты на столе</Menu.Label>
						{widgets.length === 0 ? (
							<Menu.Item disabled>Нет доступных виджетов</Menu.Item>
						) : (
							widgets.map((manifest) => {
								const checked = isWidgetEnabled(entries, manifest.id);
								return (
									<Menu.Item
										key={manifest.id}
										closeMenuOnClick={false}
										onClick={() => {
											void handleToggle(manifest.id);
										}}
										leftSection={
											<Checkbox
												checked={checked}
												readOnly
												tabIndex={-1}
												size="xs"
												aria-hidden
											/>
										}
									>
										<Stack gap={0}>
											<Text size="sm">{manifest.name}</Text>
											{manifest.widgetDescription ? (
												<Text size="xs" c="dimmed">
													{manifest.widgetDescription}
												</Text>
											) : null}
										</Stack>
									</Menu.Item>
								);
							})
						)}
					</Menu.Dropdown>
				</Menu>
			) : null}
		</>
	);
}
