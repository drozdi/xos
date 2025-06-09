import { Box, Button, Stack } from '@mantine/core';
import { IconReload } from '@tabler/icons-react';
import { Window } from '../../components/window';
import { useApp } from '../../core/app-system';
import { Field, Information } from './components';
import store from './store';

const WIN_COMBINATIONS = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[6, 4, 2],
];

export function AppTicTacToe() {
	const { isEnd, field, setPlayer, draw, endGame, restart } = store();
	const $app = useApp();
	$app.on('reload', () => restart());
	const checkWinner = () => {
		if (isEnd) {
			return;
		}
		let win = false;
		for (let combination of WIN_COMBINATIONS) {
			let [a, b, c] = combination;
			if (field[a] && field[a] === field[b] && field[b] === field[c]) {
				win = true;
				endGame();
				setPlayer(field[a]);
			}
		}
		if (!win && field.every((cell) => cell !== '')) {
			draw();
		}
	};

	checkWinner();

	return (
		<Window title="Крестик Нолик" h={370} draggable icons="reload collapse close">
			<Stack h="100%" align="stretch" justify="flex-start" gap="xs">
				<Box ta="center" size="xl">
					<Information />
					<Button
						size="sm"
						disabled={!isEnd}
						color="info"
						onClick={() => restart()}
					>
						<IconReload />
					</Button>
				</Box>
				<Field />
			</Stack>
		</Window>
	);
}

AppTicTacToe.displayName = 'apps/tic-tac-toe/app';

export default AppTicTacToe;
