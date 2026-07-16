import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { mainGroupApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useAuthStore } from '@/core/auth/authStore';

interface OuSelectProps {
	label?: string;
	value: number | null | undefined;
	onChange: (ouId: number | null) => void;
	disabled?: boolean;
	error?: string;
	withAsterisk?: boolean;
}

export function OuSelect({
	label = 'Подразделение',
	value,
	onChange,
	disabled,
	error,
	withAsterisk,
}: OuSelectProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	const query = useQuery({
		queryKey: queryKeys.main.groupFilter,
		queryFn: () => mainGroupApi.filter(),
		enabled: isAuthenticated,
	});

	const options = (query.data ?? []).map((ou) => ({
		value: String(ou.id),
		label: `${ou.name} - ${ou.code}`,
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
