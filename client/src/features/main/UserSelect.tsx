import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { mainUserApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAuthStore } from '@/core/auth/authStore';
import type { ListRequest } from '@/types/api.types';

/** Пользователи только из подразделений с флагом «Руководители». */
export const tutorOuUserFilters: ListRequest['filters'] = {
	ou: { isTutors: 1 },
};

interface UserSelectProps {
	label?: string;
	value: number | null | undefined;
	onChange: (userId: number | null, label?: string) => void;
	filters?: ListRequest['filters'];
	disabled?: boolean;
	error?: string;
	withAsterisk?: boolean;
}

export function UserSelect({
	label = 'Ответственный',
	value,
	onChange,
	filters,
	disabled,
	error,
	withAsterisk,
}: UserSelectProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const [search, setSearch] = useState('');
	const queryText = search.trim();

	const query = useQuery({
		queryKey: queryKeys.main.userSelect({ ...filters, q: queryText }),
		queryFn: () => mainUserApi.select({ filters: { ...filters, q: queryText } }),
		enabled: isAuthenticated && queryText.length > 0,
	});

	const options = (query.data?.items ?? []).map((item) => ({
		value: String(item.value),
		label: item.label,
	}));

	return (
		<Select
			label={label}
			withAsterisk={withAsterisk}
			error={error}
			data={options}
			value={value ? String(value) : null}
			onChange={(next) => {
				if (!next) {
					onChange(null);
					return;
				}
				onChange(Number(next), options.find((item) => item.value === next)?.label);
			}}
			searchable
			searchValue={search}
			onSearchChange={setSearch}
			clearable
			disabled={disabled || query.isError}
			nothingFoundMessage={query.isLoading ? 'Загрузка…' : 'Ничего не найдено'}
		/>
	);
}
