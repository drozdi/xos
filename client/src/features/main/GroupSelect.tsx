import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { mainGroupApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAuthStore } from '@/core/auth/authStore';

interface GroupSelectProps {
	label?: string;
	value: number | null | undefined;
	onChange: (groupId: number | null) => void;
	ouId?: number | null;
	excludeId?: number;
	disabled?: boolean;
	error?: string;
	withAsterisk?: boolean;
}

export function GroupSelect({
	label = 'Родительская группа',
	value,
	onChange,
	ouId,
	excludeId,
	disabled,
	error,
	withAsterisk,
}: GroupSelectProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const resolvedOuId = ouId && ouId > 0 ? ouId : null;
	const enabled = isAuthenticated && resolvedOuId !== null;

	const listRequest = useMemo(
		() => ({
			limit: -1,
			offset: 1,
			filters: { ou: resolvedOuId },
		}),
		[resolvedOuId],
	);

	const query = useQuery({
		queryKey: queryKeys.main.groups(listRequest),
		queryFn: () => mainGroupApi.list(listRequest),
		enabled,
	});

	const options = useMemo(
		() =>
			(query.data?.items ?? [])
				.filter((group) => group.id !== excludeId)
				.map((group) => ({
					value: String(group.id),
					label: `${group.name} - ${group.code}`,
				})),
		[excludeId, query.data?.items],
	);

	useEffect(() => {
		if (!enabled || query.isLoading || !value) {
			return;
		}
		if (!options.some((option) => Number(option.value) === value)) {
			onChange(null);
		}
	}, [enabled, onChange, options, query.isLoading, value]);

	return (
		<Select
			label={label}
			withAsterisk={withAsterisk}
			error={error}
			data={options}
			value={value ? String(value) : null}
			onChange={(next) => onChange(next ? Number(next) : null)}
			searchable
			clearable
			disabled={disabled || !enabled || query.isError}
			nothingFoundMessage={
				!resolvedOuId
					? 'Сначала выберите подразделение'
					: query.isLoading
						? 'Загрузка…'
						: 'Нет групп в этом подразделении'
			}
		/>
	);
}
