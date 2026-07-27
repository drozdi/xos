import {
	ActionIcon,
	Button,
	Group,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { deviceSoftwareApi } from '@/core/api/endpoints/deviceApi';
import { nextTempId } from '@/features/device/deviceAppUtils';

import { LICENSE_KEY_TYPES } from '../device-license/constants';

type KeyRecord = Record<string, unknown>;

interface LicenseKeysEditorProps {
	typeId: number | null | undefined;
	records: Record<string, KeyRecord>;
	readOnly: boolean;
	onChange: (records: Record<string, KeyRecord>) => void;
}

export function LicenseKeysEditor({
	typeId,
	records,
	readOnly,
	onChange,
}: LicenseKeysEditorProps) {
	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'license-keys', typeId],
		queryFn: () =>
			deviceSoftwareApi.list({
				limit: -1,
				offset: 1,
				filters: typeId ? { type: typeId, parent: null } : { parent: null },
			}),
		enabled: typeId != null,
	});

	const softwareOptions = useMemo(
		() =>
			(softwareQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.name || String(item.id),
			})),
		[softwareQuery.data?.items],
	);

	const keyTypeOptions = useMemo(
		() => LICENSE_KEY_TYPES.map((value) => ({ value, label: value })),
		[],
	);

	const entries = Object.entries(records ?? {});

	const updateItem = (key: string, patch: Partial<KeyRecord>) => {
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
				software_id: '',
				typeKey: '',
				value: '',
				actived: '',
			},
		});
	};

	return (
		<Stack gap="sm">
			<Group justify="space-between">
				<strong>Ключи</strong>
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
							<Table.Th>Программа</Table.Th>
							<Table.Th w={120}>Тип ключа</Table.Th>
							<Table.Th>Ключ</Table.Th>
							<Table.Th>Код активации</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => (
							<Table.Tr key={key}>
								<Table.Td>
									<Select
										data={softwareOptions}
										value={
											item.software_id != null && item.software_id !== ''
												? String(item.software_id)
												: null
										}
										readOnly={readOnly}
										disabled={typeId == null}
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
									<Select
										data={keyTypeOptions}
										value={item.typeKey ? String(item.typeKey) : null}
										readOnly={readOnly}
										onChange={(value) =>
											updateItem(key, {
												typeKey: value ?? '',
											})
										}
									/>
								</Table.Td>
								<Table.Td>
									<TextInput
										value={String(item.value ?? '')}
										readOnly={readOnly}
										onChange={(e) =>
											updateItem(key, {
												value: e.currentTarget.value,
											})
										}
									/>
								</Table.Td>
								<Table.Td>
									<TextInput
										value={String(item.actived ?? '')}
										readOnly={readOnly}
										onChange={(e) =>
											updateItem(key, {
												actived: e.currentTarget.value,
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
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
