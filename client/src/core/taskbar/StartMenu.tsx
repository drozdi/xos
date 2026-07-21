import { Button, Menu, Text } from '@mantine/core';

import { useState } from 'react';



import { StartMenuPanel } from './startMenu/StartMenuPanel';



export function StartMenu() {
	const [opened, setOpened] = useState(false);
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
			trapFocus={false}
		>
			<Menu.Target>
				<Button
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

