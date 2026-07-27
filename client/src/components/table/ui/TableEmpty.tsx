import { Center, Stack, Text } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import type { TableEmptyProps } from './type';

export function TableEmpty({ Icon = IconDatabaseOff, text, children }: TableEmptyProps) {
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