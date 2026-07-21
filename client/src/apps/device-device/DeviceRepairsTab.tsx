import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Stack,
	Table,
	Text,
	TextInput,
	Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { useWindowSize } from '@/core/windowManager';
import { nextTempId, normalizeIdRecord } from '@/features/device/deviceAppUtils';
import { formatDeviceDate, parseDeviceDate } from '@/features/device/deviceDateUtils';

type RepairRecord = Record<string, unknown>;

interface DeviceRepairsTabProps {
	repairs: unknown;
	readOnly: boolean;
	onChange: (repairs: Record<string, RepairRecord>) => void;
}

function isRepairCompleted(item: RepairRecord): boolean {
	return Boolean(String(item.receivedFrom ?? '').trim() && String(item.description ?? '').trim());
}

function RepairDateField({
	label,
	value,
	readOnly,
	onChange,
}: {
	label: string;
	value: string;
	readOnly: boolean;
	onChange: (value: string) => void;
}) {
	if (readOnly && value.trim()) {
		return (
			<Stack gap={2}>
				<Text size="xs" c="dimmed">
					{label}
				</Text>
				<Text size="sm">{value}</Text>
			</Stack>
		);
	}

	if (readOnly) {
		return (
			<Stack gap={2}>
				<Text size="xs" c="dimmed">
					{label}
				</Text>
				<Text size="sm" c="dimmed">
					—
				</Text>
			</Stack>
		);
	}

	return (
		<DatePickerInput
			label={label}
			value={parseDeviceDate(value)}
			valueFormat="YYYY.MM.DD"
			onChange={(date) => onChange(formatDeviceDate(date))}
		/>
	);
}

function RepairEntry({
	item,
	entryKey,
	readOnly,
	onFieldChange,
	onRemove,
	layout,
}: {
	item: RepairRecord;
	entryKey: string;
	readOnly: boolean;
	onFieldChange: (key: string, field: string, value: unknown) => void;
	onRemove: (key: string) => void;
	layout: 'table' | 'card';
}) {
	const putInto = String(item.putInto ?? '');
	const receivedFrom = String(item.receivedFrom ?? '');
	const putIntoLocked = putInto.trim().length > 0;
	const receivedFromLocked = receivedFrom.trim().length > 0;
	const completed = isRepairCompleted(item) || Boolean(item.closed);

	const removeButton =
		!readOnly && Number(item.id) === 0 ? (
			<ActionIcon
				color="red"
				variant="light"
				aria-label="Удалить"
				onClick={() => onRemove(entryKey)}
			>
				<IconTrash size={16} />
			</ActionIcon>
		) : null;

	const statusLabel = completed ? 'Завершён' : putIntoLocked ? 'В ремонте' : 'Новый';

	if (layout === 'table') {
		return (
			<Table.Tr>
				<Table.Td>
					<RepairDateField
						label=""
						value={putInto}
						readOnly={readOnly || putIntoLocked}
						onChange={(value) => onFieldChange(entryKey, 'putInto', value)}
					/>
				</Table.Td>
				<Table.Td>
					<RepairDateField
						label=""
						value={receivedFrom}
						readOnly={readOnly || receivedFromLocked}
						onChange={(value) => onFieldChange(entryKey, 'receivedFrom', value)}
					/>
				</Table.Td>
				<Table.Td>
					<TextInput
						value={String(item.repairman ?? '')}
						readOnly={readOnly}
						onChange={(e) => onFieldChange(entryKey, 'repairman', e.currentTarget.value)}
					/>
				</Table.Td>
				<Table.Td>
					<TextInput
						value={String(item.reason ?? '')}
						readOnly={readOnly}
						onChange={(e) => onFieldChange(entryKey, 'reason', e.currentTarget.value)}
					/>
				</Table.Td>
				<Table.Td>
					<Textarea
						value={String(item.description ?? '')}
						readOnly={readOnly}
						minRows={1}
						autosize
						onChange={(e) => onFieldChange(entryKey, 'description', e.currentTarget.value)}
					/>
				</Table.Td>
				<Table.Td>
					<Text size="sm">{statusLabel}</Text>
				</Table.Td>
				{!readOnly ? <Table.Td w={48}>{removeButton}</Table.Td> : null}
			</Table.Tr>
		);
	}

	return (
		<Paper withBorder p="sm">
			<Group justify="space-between" align="flex-start" mb="xs">
				<Text fw={500} size="sm">
					Ремонт {putInto || 'без даты сдачи'}
				</Text>
				<Group gap="xs">
					<Text size="xs" c="dimmed">
						{statusLabel}
					</Text>
					{removeButton}
				</Group>
			</Group>
			<Stack gap="sm">
				<RepairDateField
					label="Дата сдачи"
					value={putInto}
					readOnly={readOnly || putIntoLocked}
					onChange={(value) => onFieldChange(entryKey, 'putInto', value)}
				/>
				<RepairDateField
					label="Дата получения"
					value={receivedFrom}
					readOnly={readOnly || receivedFromLocked}
					onChange={(value) => onFieldChange(entryKey, 'receivedFrom', value)}
				/>
				<TextInput
					label="Исполнитель"
					value={String(item.repairman ?? '')}
					readOnly={readOnly}
					onChange={(e) => onFieldChange(entryKey, 'repairman', e.currentTarget.value)}
				/>
				<Textarea
					label="Причина"
					value={String(item.reason ?? '')}
					readOnly={readOnly}
					minRows={2}
					autosize
					onChange={(e) => onFieldChange(entryKey, 'reason', e.currentTarget.value)}
				/>
				<Textarea
					label="Заключение"
					value={String(item.description ?? '')}
					readOnly={readOnly}
					minRows={2}
					autosize
					onChange={(e) => onFieldChange(entryKey, 'description', e.currentTarget.value)}
				/>
			</Stack>
		</Paper>
	);
}

export function DeviceRepairsTab({ repairs, readOnly, onChange }: DeviceRepairsTabProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = windowWidth >= 900;
	const records = normalizeIdRecord(repairs);
	const entries = Object.entries(records);

	const updateItem = (key: string, field: string, value: unknown) => {
		const current = records[key] ?? {};
		onChange({
			...records,
			[key]: {
				...current,
				[field]: value,
				closed:
					field === 'description' || field === 'receivedFrom'
						? isRepairCompleted({
								...current,
								[field]: value,
							})
						: current.closed,
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
				putInto: '',
				receivedFrom: '',
				repairman: '',
				reason: '',
				description: '',
				closed: false,
			},
		});
	};

	return (
		<Stack gap="sm">
			<Group justify="space-between">
				<strong>Ремонты</strong>
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
			) : isTableLayout ? (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={140}>Дата сдачи</Table.Th>
							<Table.Th w={140}>Дата получения</Table.Th>
							<Table.Th>Исполнитель</Table.Th>
							<Table.Th>Причина</Table.Th>
							<Table.Th>Заключение</Table.Th>
							<Table.Th w={100}>Статус</Table.Th>
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => (
							<RepairEntry
								key={key}
								entryKey={key}
								item={item}
								readOnly={readOnly}
								layout="table"
								onFieldChange={updateItem}
								onRemove={removeItem}
							/>
						))}
					</Table.Tbody>
				</Table>
			) : (
				entries.map(([key, item]) => (
					<RepairEntry
						key={key}
						entryKey={key}
						item={item}
						readOnly={readOnly}
						layout="card"
						onFieldChange={updateItem}
						onRemove={removeItem}
					/>
				))
			)}
		</Stack>
	);
}
