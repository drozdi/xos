import { Button, Grid } from '@mantine/core';
import store from '../store';

export function Field() {
	const { isEnd, player, field, setPlayer, setField } = store();
	const handleClickField = (i) => {
		if (isEnd || field[i]) {
			return;
		}
		let newField = field.slice();
		newField[i] = player;
		setField(newField);
		setPlayer(player === 'X' ? 'O' : 'X');
	};
	return (
		<Grid justify="center" align="center" columns={3} gutter={0}>
			{field.map((cell, index) => {
				return (
					<Grid.Col p="xs" ta="center" key={index} span={1}>
						<Button
							size="lg"
							fullWidth
							onClick={() => handleClickField(index)}
						>
							{cell}
						</Button>
					</Grid.Col>
				);
			})}
		</Grid>
	);
}
