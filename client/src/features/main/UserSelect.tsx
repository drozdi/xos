import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

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
	onChange: (userId: number | null) => void;
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

	const query = useQuery({
		queryKey: queryKeys.main.userSelect(filters),
		queryFn: () => mainUserApi.select({ filters }),
		enabled: isAuthenticated,
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
			onChange={(next) => onChange(next ? Number(next) : null)}
			searchable
			clearable
			disabled={disabled || query.isError}
			nothingFoundMessage={query.isLoading ? 'Загрузка…' : 'Ничего не найдено'}
		/>
	);
}
