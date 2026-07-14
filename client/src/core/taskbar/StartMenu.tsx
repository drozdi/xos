import { Button, Menu, ScrollArea, Text } from '@mantine/core';
import { useState } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppManager } from '@/core/appManager/useAppManager';

import { AppIcon } from './taskbarUtils';

export function StartMenu() {
	const [opened, setOpened] = useState(false);
	const launchApp = useAppManager((state) => state.launchApp);
	const apps = AppRegistry.getAvailable();

	const handleLaunch = (appId: string) => {
		setOpened(false);
		void launchApp(appId);
	};

	return (
		<Menu
			opened={opened}
			onChange={setOpened}
			position="top-start"
			offset={8}
			zIndex={1100}
			withinPortal
		>
			<Menu.Target>
				<Button
					variant="subtle"
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

			<Menu.Dropdown>
				<ScrollArea.Autosize mah={360} type="auto">
					{apps.length === 0 ? (
						<Menu.Item disabled>No apps available</Menu.Item>
					) : (
						apps.map((app) => (
							<Menu.Item
								key={app.id}
								leftSection={<AppIcon icon={app.icon} size={18} />}
								onClick={() => handleLaunch(app.id)}
							>
								{app.name}
							</Menu.Item>
						))
					)}
				</ScrollArea.Autosize>
			</Menu.Dropdown>
		</Menu>
	);
}
