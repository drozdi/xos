import { Form, Select } from 'antd';
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
		<Form.Item
			label={label}
			required={withAsterisk}
			validateStatus={error ? 'error' : undefined}
			help={error}
			style={{ marginBottom: 0 }}
		>
			<Select
				options={options}
				value={value ? String(value) : undefined}
				onChange={(next) => onChange(next ? Number(next) : null)}
				showSearch
				allowClear
				optionFilterProp="label"
				disabled={disabled || query.isError}
				notFoundContent={query.isLoading ? 'Загрузка…' : 'Ничего не найдено'}
				style={{ width: '100%' }}
			/>
		</Form.Item>
	);
}
