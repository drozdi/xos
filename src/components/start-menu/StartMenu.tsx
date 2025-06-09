import { Button, Group, Popover, Stack } from '@mantine/core';
import {
	IconBrandWindows,
	IconCalculator,
	IconLogout,
	IconSettings,
	IconTicTac,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { appManager } from '../../core/app-system/app-manager';

import '../../apps/calculator/core';
import '../../apps/tic-tac-toe/core';

export const StartMenu = () => {
	const [opened, setOpened] = useState(false);
	const onCalculator = () => {
		appManager.createApp('apps/calculator/app', {});
	};
	const onIconTicTac = () => {
		appManager.createApp('apps/tic-tac-toe/app', {});
	};
	useEffect(() => {
		appManager.reloadApps();
	}, []);

	return (
		<Popover
			opened={opened}
			onDismiss={() => setOpened(false)}
			position="top-start"
			offset={{ mainAxis: 0, crossAxis: -20 }}
		>
			<Popover.Target>
				<Button
					size="lg"
					radius={0}
					variant={opened ? 'light' : 'subtle'}
					color="gray"
					onClick={() => setOpened((o) => !o)}
				>
					<IconBrandWindows />
				</Button>
			</Popover.Target>
			<Popover.Dropdown p={0}>
				<Group h={300}>
					<Stack align="stretch" justify="space-between" gap={0} h="100%">
						<Stack align="stretch" justify="flex-start" gap={0}></Stack>
						<Stack align="stretch" justify="flex-end" gap={0}>
							<Button size="lg" radius={0} color="gray" variant="subtle">
								<IconSettings />
							</Button>
							<Button size="lg" radius={0} color="gray" variant="subtle">
								<IconLogout />
							</Button>
						</Stack>
					</Stack>
					<Stack>
						<Button
							size="lg"
							radius={0}
							variant={opened ? 'light' : 'subtle'}
							color="gray"
							leftSection={<IconCalculator />}
							onClick={onCalculator}
						>
							Calculator
						</Button>
						<Button
							size="lg"
							radius={0}
							variant={opened ? 'light' : 'subtle'}
							color="gray"
							leftSection={<IconTicTac />}
							onClick={onIconTicTac}
						>
							TicTacToe
						</Button>
					</Stack>
				</Group>
			</Popover.Dropdown>
		</Popover>
	);
};
