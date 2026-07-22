import { Button, Menu, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { StartMenuPanel } from './startMenu/StartMenuPanel';
import {
	START_MENU_CONTEXT_ATTR,
	START_MENU_ROOT_ATTR,
} from './startMenu/useStartMenuItemMenu';

export function StartMenu() {
	const [opened, setOpened] = useState(false);

	useEffect(() => {
		if (!opened) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Element | null;
			if (!target) {
				return;
			}
			if (target.closest('[data-start-menu-target]')) {
				return;
			}
			if (target.closest(`[${START_MENU_ROOT_ATTR}]`)) {
				return;
			}
			if (target.closest(`[${START_MENU_CONTEXT_ATTR}]`)) {
				return;
			}
			// Nested menus from the start panel (e.g. shutdown) are portaled.
			if (target.closest('.mantine-Menu-dropdown')) {
				return;
			}
			setOpened(false);
		};

		document.addEventListener('pointerdown', handlePointerDown, true);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown, true);
		};
	}, [opened]);

	return (
		<Menu
			opened={opened}
			onChange={setOpened}
			position="top-start"
			offset={8}
			zIndex={2000}
			withinPortal
			floatingStrategy="fixed"
			hideDetached={false}
			closeOnItemClick={false}
			closeOnClickOutside={false}
			trapFocus={false}
		>
			<Menu.Target>
				<Button
					data-start-menu-target=""
					variant={opened ? 'light' : 'subtle'}
					color="gray"
					size="sm"
					leftSection={
						<Text fw={700} size="sm" c="blue.4">
							X
						</Text>
					}
				>
					Пуск
				</Button>
			</Menu.Target>
			<Menu.Dropdown
				p={0}
				data-start-menu-root=""
				styles={{
					dropdown: {
						padding: 0,
						border: 'none',
						background: 'transparent',
					},
				}}
			>
				<StartMenuPanel onClose={() => setOpened(false)} />
			</Menu.Dropdown>
		</Menu>
	);
}
