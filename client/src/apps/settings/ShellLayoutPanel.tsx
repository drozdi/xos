import { Alert, Select, Stack, Text } from '@mantine/core';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { useLayoutContext } from '@/core/layout/LayoutContext';
import { useSetting } from '@/core/settings/hooks';

const LAYOUT_PRESETS = [
	{ value: 'h m f', label: 'h m f — header / main / footer' },
	{ value: 'hhh lmr fff', label: 'hhh lmr fff — с боковыми панелями' },
];

export function ShellLayoutPanel() {
	const { isMobile } = useLayoutContext();
	const [view, setView] = useSetting<string>(
		'USER',
		'layout.view',
		HKEY_CONFIG_DEFAULTS.layout.view,
	);
	const [mobileView, setMobileView] = useSetting<string>(
		'USER',
		'layout.mobileView',
		HKEY_CONFIG_DEFAULTS.layout.mobileView,
	);

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Раскладка оболочки (USER, sync через desktop-state).
			</Text>
			{isMobile ? (
				<Alert color="blue" title="Мобильный режим">
					Активен мобильный макет. Класс <code>xos-mobile</code> на body.
				</Alert>
			) : (
				<Alert color="gray" title="Десктоп">
					Мобильный breakpoint: max-width 767px.
				</Alert>
			)}
			<Select
				label="layout.view"
				description="Десктопный макет"
				data={LAYOUT_PRESETS}
				value={view ?? HKEY_CONFIG_DEFAULTS.layout.view}
				onChange={(value) => {
					if (value) {
						setView(value);
					}
				}}
				searchable
				allowDeselect={false}
			/>
			<Select
				label="layout.mobileView"
				description="Макет на мобильных"
				data={LAYOUT_PRESETS}
				value={mobileView ?? HKEY_CONFIG_DEFAULTS.layout.mobileView}
				onChange={(value) => {
					if (value) {
						setMobileView(value);
					}
				}}
				searchable
				allowDeselect={false}
			/>
		</Stack>
	);
}
