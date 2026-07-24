import {
	Button,
	Card,
	DatePicker,
	Flex,
	Form,
	Input,
	Table,
	Typography,
} from 'antd';
import dayjs from 'dayjs';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { ReactNode } from 'react';

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

function toDayjs(value: string) {
	const parsed = parseDeviceDate(value);
	if (!parsed) {
		return null;
	}
	const d = dayjs(parsed);
	return d.isValid() ? d : null;
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
			<Flex vertical gap={2}>
				{label ? (
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{label}
					</Typography.Text>
				) : null}
				<Typography.Text>{value}</Typography.Text>
			</Flex>
		);
	}

	if (readOnly) {
		return (
			<Flex vertical gap={2}>
				{label ? (
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{label}
					</Typography.Text>
				) : null}
				<Typography.Text type="secondary">—</Typography.Text>
			</Flex>
		);
	}

	const field = (
		<DatePicker
			value={toDayjs(value)}
			format="YYYY.MM.DD"
			style={{ width: '100%' }}
			onChange={(date) => onChange(formatDeviceDate(date ? date.toDate() : null))}
		/>
	);

	return label ? (
		<Form.Item label={label} style={{ marginBottom: 0 }}>
			{field}
		</Form.Item>
	) : (
		field
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

	type RepairTableRow = {
		key: string;
		putInto: string;
		receivedFrom: string;
		repairman: string;
		reason: string;
		description: string;
		statusLabel: string;
		putIntoLocked: boolean;
		receivedFromLocked: boolean;
		removeButton: ReactNode;
	};

	const buildTableRow = (key: string, item: RepairRecord): RepairTableRow => {
		const putInto = String(item.putInto ?? '');
		const receivedFrom = String(item.receivedFrom ?? '');
		const putIntoLocked = putInto.trim().length > 0;
		const receivedFromLocked = receivedFrom.trim().length > 0;
		const completed = isRepairCompleted(item) || Boolean(item.closed);
		const statusLabel = completed ? 'Завершён' : putIntoLocked ? 'В ремонте' : 'Новый';

		return {
			key,
			putInto,
			receivedFrom,
			repairman: String(item.repairman ?? ''),
			reason: String(item.reason ?? ''),
			description: String(item.description ?? ''),
			statusLabel,
			putIntoLocked,
			receivedFromLocked,
			removeButton:
				!readOnly && Number(item.id) === 0 ? (
					<Button
						type="text"
						danger
						aria-label="Удалить"
						icon={<IconTrash size={16} />}
						onClick={() => removeItem(key)}
					/>
				) : null,
		};
	};

	const renderCard = (key: string, item: RepairRecord) => {
		const putInto = String(item.putInto ?? '');
		const receivedFrom = String(item.receivedFrom ?? '');
		const putIntoLocked = putInto.trim().length > 0;
		const receivedFromLocked = receivedFrom.trim().length > 0;
		const completed = isRepairCompleted(item) || Boolean(item.closed);
		const statusLabel = completed ? 'Завершён' : putIntoLocked ? 'В ремонте' : 'Новый';
		const removeButton =
			!readOnly && Number(item.id) === 0 ? (
				<Button
					type="text"
					danger
					aria-label="Удалить"
					icon={<IconTrash size={16} />}
					onClick={() => removeItem(key)}
				/>
			) : null;

		return (
			<Card key={key} size="small">
				<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
					<Typography.Text strong style={{ fontSize: 14 }}>
						Ремонт {putInto || 'без даты сдачи'}
					</Typography.Text>
					<Flex gap={8} align="center">
						<Typography.Text type="secondary" style={{ fontSize: 12 }}>
							{statusLabel}
						</Typography.Text>
						{removeButton}
					</Flex>
				</Flex>
				<Flex vertical gap={12}>
					<RepairDateField
						label="Дата сдачи"
						value={putInto}
						readOnly={readOnly || putIntoLocked}
						onChange={(value) => updateItem(key, 'putInto', value)}
					/>
					<RepairDateField
						label="Дата получения"
						value={receivedFrom}
						readOnly={readOnly || receivedFromLocked}
						onChange={(value) => updateItem(key, 'receivedFrom', value)}
					/>
					<Form.Item label="Исполнитель" style={{ marginBottom: 0 }}>
						<Input
							value={String(item.repairman ?? '')}
							readOnly={readOnly}
							onChange={(e) => updateItem(key, 'repairman', e.target.value)}
						/>
					</Form.Item>
					<Form.Item label="Причина" style={{ marginBottom: 0 }}>
						<Input.TextArea
							value={String(item.reason ?? '')}
							readOnly={readOnly}
							autoSize={{ minRows: 2 }}
							onChange={(e) => updateItem(key, 'reason', e.target.value)}
						/>
					</Form.Item>
					<Form.Item label="Заключение" style={{ marginBottom: 0 }}>
						<Input.TextArea
							value={String(item.description ?? '')}
							readOnly={readOnly}
							autoSize={{ minRows: 2 }}
							onChange={(e) => updateItem(key, 'description', e.target.value)}
						/>
					</Form.Item>
				</Flex>
			</Card>
		);
	};

	const tableData = entries.map(([key, item]) => buildTableRow(key, item));

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<strong>Ремонты</strong>
				{!readOnly ? (
					<Button size="small" icon={<IconPlus size={14} />} onClick={addItem}>
						Добавить
					</Button>
				) : null}
			</Flex>

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет записей</Typography.Text>
			) : isTableLayout ? (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey="key"
					dataSource={tableData}
					columns={[
						{
							title: 'Дата сдачи',
							key: 'putInto',
							width: 140,
							render: (_, row) => (
								<RepairDateField
									label=""
									value={row.putInto}
									readOnly={readOnly || row.putIntoLocked}
									onChange={(value) => updateItem(row.key, 'putInto', value)}
								/>
							),
						},
						{
							title: 'Дата получения',
							key: 'receivedFrom',
							width: 140,
							render: (_, row) => (
								<RepairDateField
									label=""
									value={row.receivedFrom}
									readOnly={readOnly || row.receivedFromLocked}
									onChange={(value) => updateItem(row.key, 'receivedFrom', value)}
								/>
							),
						},
						{
							title: 'Исполнитель',
							key: 'repairman',
							render: (_, row) => (
								<Input
									value={row.repairman}
									readOnly={readOnly}
									onChange={(e) => updateItem(row.key, 'repairman', e.target.value)}
								/>
							),
						},
						{
							title: 'Причина',
							key: 'reason',
							render: (_, row) => (
								<Input
									value={row.reason}
									readOnly={readOnly}
									onChange={(e) => updateItem(row.key, 'reason', e.target.value)}
								/>
							),
						},
						{
							title: 'Заключение',
							key: 'description',
							render: (_, row) => (
								<Input.TextArea
									value={row.description}
									readOnly={readOnly}
									autoSize={{ minRows: 1 }}
									onChange={(e) => updateItem(row.key, 'description', e.target.value)}
								/>
							),
						},
						{
							title: 'Статус',
							key: 'status',
							width: 100,
							render: (_, row) => <Typography.Text>{row.statusLabel}</Typography.Text>,
						},
						...(!readOnly
							? [
									{
										title: '',
										key: 'actions',
										width: 48,
										render: (_: unknown, row: (typeof tableData)[number]) => row.removeButton,
									},
								]
							: []),
					]}
				/>
			) : (
				entries.map(([key, item]) => renderCard(key, item))
			)}
		</Flex>
	);
}
