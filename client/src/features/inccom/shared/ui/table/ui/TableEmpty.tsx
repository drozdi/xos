import { Center, Stack, Text } from '@mantine/core';
import { TbDatabaseOff } from 'react-icons/tb';
import type { TableEmptyProps } from './type';

export function TableEmpty({ Icon = TbDatabaseOff, text, children }: TableEmptyProps) {
	return (
		<Center w="100%" h="100%" p="lg">
			{children || (
				<Stack align="center">
					<Text fz="6rem" c="dimmed">
						<Icon />
					</Text>
					<Text c="dimmed" fz="h2" ta="center">
						{text}
					</Text>
				</Stack>
			)}
		</Center>
	);
}