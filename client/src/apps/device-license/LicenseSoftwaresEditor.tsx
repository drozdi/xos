import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
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
		<Stack gap="sm">
			<Group justify="space-between">
				<strong>Программы</strong>
				{!readOnly ? (
					<Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
						Добавить
					</Button>
				) : null}
			</Group>

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет записей
				</Text>
			) : (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Тип</Table.Th>
							<Table.Th>Программа</Table.Th>
							<Table.Th w={120}>Количество</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => {
							const typeId = item.type_id != null && item.type_id !== '' ? String(item.type_id) : null;
							const softwareOptions = typeId ? (softwareByType.get(typeId) ?? []) : [];

							return (
								<Table.Tr key={key}>
									<Table.Td>
										<Select
											data={typeOptions}
											value={typeId}
											readOnly={readOnly}
											searchable
											nothingFoundMessage="Нет типов"
											onChange={(value) =>
												updateItem(key, {
													type_id: value ?? '',
													software_id: '',
												})
											}
										/>
									</Table.Td>
									<Table.Td>
										<Select
											data={softwareOptions}
											value={
												item.software_id != null && item.software_id !== ''
													? String(item.software_id)
													: null
											}
											readOnly={readOnly}
											disabled={!typeId}
											searchable
											nothingFoundMessage="Нет программ"
											onChange={(value) =>
												updateItem(key, {
													software_id: value ?? '',
												})
											}
										/>
									</Table.Td>
									<Table.Td>
										<NumberInput
											value={typeof item.count === 'number' ? item.count : Number(item.count ?? 1)}
											readOnly={readOnly}
											min={LICENSE_SOFTWARE_COUNT_MIN}
											max={LICENSE_SOFTWARE_COUNT_MAX}
											onChange={(value) =>
												updateItem(key, {
													count: typeof value === 'number' ? value : LICENSE_SOFTWARE_COUNT_MIN,
												})
											}
										/>
									</Table.Td>
									{!readOnly ? (
										<Table.Td>
											<ActionIcon
												color="red"
												variant="light"
												aria-label="Удалить"
												onClick={() => removeItem(key)}
											>
												<IconTrash size={16} />
											</ActionIcon>
										</Table.Td>
									) : null}
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			)}

			{entries.length > 0 ? (
				<Paper withBorder p="xs">
					<Text size="xs" c="dimmed">
						Количество: от {LICENSE_SOFTWARE_COUNT_MIN} (без ограничения) до {LICENSE_SOFTWARE_COUNT_MAX}
					</Text>
				</Paper>
			) : null}
		</Stack>
	);
}
