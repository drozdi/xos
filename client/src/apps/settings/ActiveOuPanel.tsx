import { Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { mainOuApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useActiveOuId } from '@/features/main/useActiveOuId';

export function ActiveOuPanel() {
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
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Активное подразделение хранится в user_app_data (сервер) и применяется к
				Users/Groups/Device.
			</Text>
			<Select
				label="Активное подразделение (OU)"
				description="main.active_ou_id — tenancy slice (Board — global)"
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
