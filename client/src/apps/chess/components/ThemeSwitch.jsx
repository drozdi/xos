import { Flex, Segmented, Typography } from 'antd';

import { useThemePreference } from '@/core/theme';

function ThemeSwitch() {
	const { theme, setTheme } = useThemePreference();
	const value = theme === 'auto' ? 'light' : theme;

	return (
		<Flex vertical gap="small">
			<Typography.Text strong style={{ fontSize: 13 }}>
				Тема оформления
			</Typography.Text>
			<Segmented
				value={value}
				onChange={(next) => setTheme(next)}
				block
				options={[
					{ label: 'Светлая', value: 'light' },
					{ label: 'Тёмная', value: 'dark' },
				]}
			/>
		</Flex>
	);
}

export default ThemeSwitch;
