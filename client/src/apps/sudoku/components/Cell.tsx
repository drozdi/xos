import { AspectRatio, Flex } from '@mantine/core';
import store from '../store';

export function Cell({ row, col }) {
	const value = store((state) => state.cells)[row][col];
	return (
		<AspectRatio component={Flex} ratio={1} justify="center" align="center">
			{value > 0 ? value : ''}
		</AspectRatio>
	);
}
