import { Flex, Form, Input, InputNumber, Select } from 'antd';
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
		<Flex vertical gap={12}>
			<Form.Item
				label="Название"
				required
				validateStatus={errors.name ? 'error' : undefined}
				help={errors.name}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.name ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('name', e.target.value)}
				/>
			</Form.Item>
			<Form.Item
				label="Код"
				required
				validateStatus={errors.code ? 'error' : undefined}
				help={errors.code}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.code ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('code', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Тип" style={{ marginBottom: 0 }}>
				<Select
					options={typeOptions}
					value={data.typeId ? String(data.typeId) : undefined}
					disabled={readOnly}
					onChange={(value) => setField('typeId', value ? Number(value) : null)}
					showSearch
					allowClear
				/>
			</Form.Item>
			<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
				<InputNumber
					value={data.sort ?? 0}
					disabled={readOnly}
					style={{ width: '100%' }}
					onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
				/>
			</Form.Item>
			<Form.Item label="Описание" style={{ marginBottom: 0 }}>
				<Input.TextArea
					value={data.description ?? ''}
					readOnly={readOnly}
					autoSize={{ minRows: 3 }}
					onChange={(e) => setField('description', e.target.value)}
				/>
			</Form.Item>
		</Flex>
	);
}
