import { Form, Select } from 'antd';
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
