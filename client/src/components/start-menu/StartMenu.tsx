import { Button, Group, Popover, Stack } from '@mantine/core';

import { useEffect, useState } from 'react';
import {
	TbBrandWindows,
	TbCalculator,
	TbLogout,
	TbMatrix,
	TbSettings,
	TbTicTac,
} from 'react-icons/tb';
import { appManager } from '../../core/app-system/app-manager';
import { useAuthSystem } from '../../core/auth-system';

import '../../apps/calculator/core';
import '../../apps/sudoku/core';
import '../../apps/tic-tac-toe/core';

export const StartMenu = () => {
	const isAuth = useAuthSystem((state) => state.isAuth);
	const [opened, setOpened] = useState(false);
	const onCalculator = () => {
		appManager.createApp('apps/calculator/app', {});
	};
	const onIconTicTac = () => {
		appManager.createApp('apps/tic-tac-toe/app', {});
	};
	const onSudoku = () => {
		appManager.createApp('apps/sudoku/app', {});
	};
	useEffect(() => {
		isAuth && appManager.reloadApps();
	}, [isAuth]);

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
					<TbBrandWindows />
				</Button>
			</Popover.Target>
			<Popover.Dropdown p={0}>
				<Group h={300}>
					<Stack align="stretch" justify="space-between" gap={0} h="100%">
						<Stack align="stretch" justify="flex-start" gap={0}></Stack>
						<Stack align="stretch" justify="flex-end" gap={0}>
							<Button size="lg" radius={0} color="gray" variant="subtle">
								<TbSettings />
							</Button>
							<Button size="lg" radius={0} color="gray" variant="subtle">
								<TbLogout />
							</Button>
						</Stack>
					</Stack>
					<Stack gap="0" justify="start">
						<Button
							size="lg"
							radius={0}
							variant={opened ? 'light' : 'subtle'}
							color="gray"
							leftSection={<TbMatrix />}
							onClick={onSudoku}
						>
							Sudoku
						</Button>
						<Button
							size="lg"
							radius={0}
							variant={opened ? 'light' : 'subtle'}
							color="gray"
							leftSection={<TbCalculator />}
							onClick={onCalculator}
						>
							Calculator
						</Button>
						<Button
							size="lg"
							radius={0}
							variant={opened ? 'light' : 'subtle'}
							color="gray"
							leftSection={<TbTicTac />}
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
