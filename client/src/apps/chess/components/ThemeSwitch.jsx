import { SegmentedControl, Stack, Text } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

function ThemeSwitch() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	return (
		<Stack gap="xs">
			<Text size="sm" fw={500}>
				Тема оформления
			</Text>
			<SegmentedControl
				value={colorScheme}
				onChange={setColorScheme}
				fullWidth
				data={[
					{ label: 'Светлая', value: 'light' },
					{ label: 'Тёмная', value: 'dark' },
				]}
			/>
		</Stack>
	);
}

export default ThemeSwitch;
