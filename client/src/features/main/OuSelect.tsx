import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { mainOuApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAuthStore } from '@/core/auth/authStore';
import type { ListRequest } from '@/types/api.types';

interface OuSelectProps {
	label?: string;
	value: number | null | undefined;
	onChange: (ouId: number | null) => void;
	filters?: ListRequest['filters'];
	disabled?: boolean;
	error?: string;
	withAsterisk?: boolean;
}

export function OuSelect({
	label = 'Подразделение',
	value,
	onChange,
	filters,
	disabled,
	error,
	withAsterisk,
}: OuSelectProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	const query = useQuery({
		queryKey: queryKeys.main.ouSelect(filters),
		queryFn: () => mainOuApi.select({ filters }),
		enabled: isAuthenticated,
	});

	const options = (query.data?.items ?? []).map((ou) => ({
		value: String(ou.value),
		label: ou.label,
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
