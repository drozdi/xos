
import { Center, Stack, Text } from '@mantine/core';

export interface TableErrorProps {
	children: React.ReactNode;
}

export function TableError({ children }: TableErrorProps) {
	if (!children) {
		return null;
	}
	return (
		<Center w="100%" h="100%" p="lg">
			<Stack align="center">
				<Text c="red" fz="h2" ta="center">
					{children}
				</Text>
			</Stack>
		</Center>
	);
}