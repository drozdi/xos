import {
	Button,
	Card,
	Flex,
	InputNumber,
	Select,
	Table,
	Typography,
} from 'antd';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { deviceSoftwareApi, deviceSoftwareTypeApi } from '@/core/api/endpoints/deviceApi';
import { nextTempId } from '@/features/device/deviceAppUtils';

import {
	LICENSE_SOFTWARE_COUNT_MAX,
	LICENSE_SOFTWARE_COUNT_MIN,
} from './constants';

type SoftwareRecord = Record<string, unknown>;

interface LicenseSoftwaresEditorProps {
	records: Record<string, SoftwareRecord>;
	readOnly: boolean;
	onChange: (records: Record<string, SoftwareRecord>) => void;
}

export function LicenseSoftwaresEditor({
	records,
	readOnly,
	onChange,
}: LicenseSoftwaresEditorProps) {
	const typesQuery = useQuery({
		queryKey: ['device', 'softwareTypes', 'license-editor'],
		queryFn: () => deviceSoftwareTypeApi.list({ limit: -1, offset: 1 }),
	});

	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'license-editor'],
		queryFn: () =>
			deviceSoftwareApi.list({
				limit: -1,
				offset: 1,
				filters: { parent: null },
			}),
	});

	const typeOptions = useMemo(
		() =>
			(typesQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[typesQuery.data?.items],
	);

	const softwareByType = useMemo(() => {
		const map = new Map<string, Array<{ value: string; label: string }>>();
		for (const item of softwareQuery.data?.items ?? []) {
			if (item.type_id == null) {
				continue;
			}
			const typeKey = String(item.type_id);
			const options = map.get(typeKey) ?? [];
			options.push({
				value: String(item.id),
				label: item.name || String(item.id),
			});
			map.set(typeKey, options);
		}
		return map;
	}, [softwareQuery.data?.items]);

	const entries = Object.entries(records ?? {});

	const updateItem = (key: string, patch: Partial<SoftwareRecord>) => {
		onChange({
			...records,
			[key]: {
				...records[key],
				...patch,
			},
		});
	};

	const removeItem = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addItem = () => {
		const id = nextTempId();
		onChange({
			...records,
			[id]: {
				id: 0,
				type_id: '',
				software_id: '',
				count: 1,
			},
		});
	};

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<strong>Программы</strong>
				{!readOnly ? (
					<Button size="small" icon={<IconPlus size={14} />} onClick={addItem}>
						Добавить
					</Button>
				) : null}
			</Flex>

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет записей</Typography.Text>
			) : (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey={([key]) => key}
					dataSource={entries}
					columns={[
						{
							title: 'Тип',
							key: 'type',
							render: (_: unknown, [key, item]: [string, SoftwareRecord]) => {
								const typeId =
									item.type_id != null && item.type_id !== '' ? String(item.type_id) : undefined;
								return (
									<Select
										options={typeOptions}
										value={typeId}
										disabled={readOnly}
										showSearch
										notFoundContent="Нет типов"
										style={{ width: '100%' }}
										onChange={(value) =>
											updateItem(key, {
												type_id: value ?? '',
												software_id: '',
											})
										}
									/>
								);
							},
						},
						{
							title: 'Программа',
							key: 'software',
							render: (_: unknown, [key, item]: [string, SoftwareRecord]) => {
								const typeId =
									item.type_id != null && item.type_id !== '' ? String(item.type_id) : null;
								const softwareOptions = typeId ? (softwareByType.get(typeId) ?? []) : [];
								return (
									<Select
										options={softwareOptions}
										value={
											item.software_id != null && item.software_id !== ''
												? String(item.software_id)
												: undefined
										}
										disabled={readOnly || !typeId}
										showSearch
										notFoundContent="Нет программ"
										style={{ width: '100%' }}
										onChange={(value) =>
											updateItem(key, {
												software_id: value ?? '',
											})
										}
									/>
								);
							},
						},
						{
							title: 'Количество',
							key: 'count',
							width: 120,
							render: (_: unknown, [key, item]: [string, SoftwareRecord]) => (
								<InputNumber
									value={typeof item.count === 'number' ? item.count : Number(item.count ?? 1)}
									disabled={readOnly}
									min={LICENSE_SOFTWARE_COUNT_MIN}
									max={LICENSE_SOFTWARE_COUNT_MAX}
									style={{ width: '100%' }}
									onChange={(value) =>
										updateItem(key, {
											count: typeof value === 'number' ? value : LICENSE_SOFTWARE_COUNT_MIN,
										})
									}
								/>
							),
						},
						...(!readOnly
							? [
									{
										title: '',
										key: 'actions',
										width: 48,
										render: (_: unknown, [key]: [string, SoftwareRecord]) => (
											<Button
												type="text"
												danger
												aria-label="Удалить"
												icon={<IconTrash size={16} />}
												onClick={() => removeItem(key)}
											/>
										),
									},
								]
							: []),
					]}
				/>
			)}

			{entries.length > 0 ? (
				<Card size="small">
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						Количество: от {LICENSE_SOFTWARE_COUNT_MIN} (без ограничения) до {LICENSE_SOFTWARE_COUNT_MAX}
					</Typography.Text>
				</Card>
			) : null}
		</Flex>
	);
}
