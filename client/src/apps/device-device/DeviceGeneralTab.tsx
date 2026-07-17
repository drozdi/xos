import { NumberInput, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DeviceDetail } from '@/core/api/endpoints/deviceApi';
import { deviceApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';

interface DeviceGeneralTabProps {
	data: DeviceDetail;
	errors: Partial<Record<keyof DeviceDetail & string, string>>;
	readOnly: boolean;
	setField: <K extends keyof DeviceDetail>(key: K, value: DeviceDetail[K]) => void;
}

export function DeviceGeneralTab({ data, errors, readOnly, setField }: DeviceGeneralTabProps) {
	const filterQuery = useQuery({
		queryKey: queryKeys.device.filter,
		queryFn: () => deviceApi.filter(),
	});

	const typeOptions = useMemo(() => {
		const options: { value: string; label: string }[] = [];
		for (const item of filterQuery.data ?? []) {
			if (item.type === 'divider' || item.value == null) {
				continue;
			}
			const prefix = item.type === 'subheader' ? '▸ ' : '';
			options.push({
				value: String(item.value),
				label: `${prefix}${item.label ?? item.value}`,
			});
		}
		return options;
	}, [filterQuery.data]);

	return (
		<Stack gap="sm">
			<TextInput
				label="Название"
				withAsterisk
				value={data.name ?? ''}
				error={errors.name}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<TextInput
				label="Код"
				withAsterisk
				value={data.code ?? ''}
				error={errors.code}
				readOnly={readOnly}
				onChange={(e) => setField('code', e.currentTarget.value)}
			/>
			<Select
				label="Тип"
				data={typeOptions}
				value={data.typeId ? String(data.typeId) : null}
				readOnly={readOnly}
				onChange={(value) => setField('typeId', value ? Number(value) : null)}
				searchable
				clearable
			/>
			<NumberInput
				label="Сортировка"
				value={data.sort ?? 0}
				readOnly={readOnly}
				onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
			/>
			<Textarea
				label="Описание"
				value={data.description ?? ''}
				readOnly={readOnly}
				minRows={3}
				autosize
				onChange={(e) => setField('description', e.currentTarget.value)}
			/>
		</Stack>
	);
}
