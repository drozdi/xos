import { Alert, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { mainOuApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useLayoutContext } from '@/core/layout/LayoutContext';
import { useSetting } from '@/core/settings/hooks';
import { useActiveOuId } from '@/features/main/useActiveOuId';

const LAYOUT_PRESETS = [
	{ value: 'h m f', label: 'h m f — header / main / footer' },
	{ value: 'hhh lmr fff', label: 'hhh lmr fff — с боковыми панелями' },
];

export default function ShellSettingsApp() {
	useWindowTitle('Макет оболочки');
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
	const { activeOuId, setActiveOuId, restored } = useActiveOuId();

	const ouQuery = useQuery({
		queryKey: queryKeys.main.ous({}),
		queryFn: () => mainOuApi.list({ limit: -1, offset: 1 }),
	});

	const ouSelectData = useMemo(
		() => [
			{ value: '', label: 'Не выбрано' },
			...(ouQuery.data?.items ?? []).map((ou) => ({
				value: String(ou.id),
				label: ou.name || `OU #${ou.id}`,
			})),
		],
		[ouQuery.data],
	);

	return (
		<Stack gap="md" p="md">
			<Text size="sm" c="dimmed">
				Пользовательские настройки раскладки оболочки (USER).
			</Text>
			{isMobile ? (
				<Alert color="blue" title="Мобильный режим">
					Сейчас активен мобильный макет (isMobile). Класс{' '}
					<code>xos-mobile</code> на body, data-xos-mobile=1 на html.
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
					if (value) setView(value);
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
					if (value) setMobileView(value);
				}}
				searchable
				allowDeselect={false}
			/>
			<Select
				label="Активное подразделение (OU)"
				description="main.active_ou_id — tenancy slice для Users/Groups/Device/Assets (Board — global)"
				data={ouSelectData}
				value={activeOuId ? String(activeOuId) : ''}
				onChange={(value) => {
					void setActiveOuId(value ? Number(value) : null);
				}}
				disabled={!restored || ouQuery.isLoading}
				searchable
				clearable
			/>
		</Stack>
	);
}
