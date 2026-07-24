import { Button } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';

import { useThemePreference } from '@/core/theme/ThemeProvider';

export function ThemeBtn() {
	const { theme, setTheme } = useThemePreference();
	const isDark =
		theme === 'dark' ||
		(theme === 'auto' &&
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches);

	return (
		<Button
			type="default"
			shape="circle"
			size="large"
			aria-label="Toggle color scheme"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			icon={isDark ? <MoonOutlined /> : <SunOutlined />}
		/>
	);
}
