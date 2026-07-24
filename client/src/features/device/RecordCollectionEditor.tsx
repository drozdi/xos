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

import { useWindowSize } from '@/core/windowManager';
import { nextTempId } from '@/features/device/deviceAppUtils';
import { formatDeviceDate, parseDeviceDate } from '@/features/device/deviceDateUtils';

type RecordItem = Record<string, unknown>;

interface RecordCollectionEditorProps {
	title?: string;
	records: Record<string, RecordItem>;
	readOnly: boolean;
	columns: Array<{
		key: string;
		label: string;
		type?: 'text' | 'textarea' | 'checkbox' | 'date';
		width?: number | string;
	}>;
	onChange: (records: Record<string, RecordItem>) => void;
	createItem?: () => RecordItem;
	tableMinWidth?: number;
	canRemove?: (item: RecordItem) => boolean;
	isRowReadOnly?: (item: RecordItem) => boolean;
}

function useTableLayout(windowWidth: number, tableMinWidth: number): boolean {
	return windowWidth >= tableMinWidth;
}

function toDayjs(value: string) {
	const parsed = parseDeviceDate(value);
	if (!parsed) {
		return null;
	}
	const d = dayjs(parsed);
	return d.isValid() ? d : null;
}

interface RecordCollectionEntryProps {
	entryKey: string;
	item: RecordItem;
	readOnly: boolean;
	columns: RecordCollectionEditorProps['columns'];
	layout: 'table' | 'card';
	canRemove?: (item: RecordItem) => boolean;
	isRowReadOnly?: (item: RecordItem) => boolean;
	onFieldChange: (key: string, field: string, value: unknown) => void;
	onRemove: (key: string) => void;
}

function renderField(
	column: RecordCollectionEditorProps['columns'][number],
	value: unknown,
	readOnly: boolean,
	onChange: (value: unknown) => void,
	withLabel: boolean,
) {
	if (column.type === 'date') {
		if (readOnly && String(value ?? '').trim()) {
			return (
				<Typography.Text style={withLabel ? undefined : { padding: '4px 0' }}>
					{String(value)}
				</Typography.Text>
			);
		}
		const field = (
			<DatePicker
				value={toDayjs(String(value ?? ''))}
				format="YYYY.MM.DD"
				disabled={readOnly}
				style={{ width: '100%' }}
				onChange={(date) => onChange(formatDeviceDate(date ? date.toDate() : null))}
			/>
		);
		return withLabel ? (
			<Form.Item label={column.label} style={{ marginBottom: 0 }}>
				{field}
			</Form.Item>
		) : (
			field
		);
	}

	if (column.type === 'textarea') {
		const field = (
			<Input.TextArea
				value={String(value ?? '')}
				readOnly={readOnly}
				autoSize={{ minRows: withLabel ? 2 : 1 }}
				onChange={(e) => onChange(e.target.value)}
			/>
		);
		return withLabel ? (
			<Form.Item label={column.label} style={{ marginBottom: 0 }}>
				{field}
			</Form.Item>
		) : (
			field
		);
	}

	const field = (
		<Input
			value={String(value ?? '')}
			readOnly={readOnly}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
	return withLabel ? (
		<Form.Item label={column.label} style={{ marginBottom: 0 }}>
			{field}
		</Form.Item>
	) : (
		field
	);
}

function RecordCollectionEntry({
	entryKey,
	item,
	readOnly,
	columns,
	layout,
	canRemove,
	isRowReadOnly,
	onFieldChange,
	onRemove,
}: RecordCollectionEntryProps) {
	const rowReadOnly = readOnly || Boolean(isRowReadOnly?.(item));
	const showRemove = !readOnly && (canRemove?.(item) ?? true);
	const removeButton = showRemove ? (
		<Button
			type="text"
			danger
			aria-label="Удалить"
			icon={<IconTrash size={16} />}
			onClick={() => onRemove(entryKey)}
		/>
	) : null;

	if (layout === 'table') {
		return (
			<>
				{columns.map((column) => (
					<td key={column.key} style={{ width: column.width }}>
						{renderField(column, item[column.key], rowReadOnly, (value) =>
							onFieldChange(entryKey, column.key, value),
						false)}
					</td>
				))}
				{!readOnly ? <td style={{ width: 48 }}>{removeButton}</td> : null}
			</>
		);
	}

	return (
		<Card size="small">
			<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
				<Typography.Text strong style={{ fontSize: 14 }}>
					{String(item.name ?? item.value ?? item.code ?? 'Запись')}
				</Typography.Text>
				{removeButton}
			</Flex>
			<Flex vertical gap={8}>
				{columns.map((column) =>
					renderField(column, item[column.key], rowReadOnly, (value) =>
						onFieldChange(entryKey, column.key, value),
					true),
				)}
			</Flex>
		</Card>
	);
}

export function RecordCollectionEditor({
	title,
	records,
	readOnly,
	columns,
	onChange,
	createItem,
	tableMinWidth = 640,
	canRemove,
	isRowReadOnly,
}: RecordCollectionEditorProps) {
	const { width: windowWidth } = useWindowSize();
	const isTableLayout = useTableLayout(windowWidth, tableMinWidth);
	const entries = Object.entries(records ?? {});

	const updateItem = (key: string, field: string, value: unknown) => {
		onChange({
			...records,
			[key]: {
				...records[key],
				[field]: value,
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
		const item = createItem?.() ?? { id: 0 };
		onChange({ ...records, [id]: item });
	};

	const layout = isTableLayout ? 'table' : 'card';

	return (
		<Flex vertical gap={12}>
			{title ? (
				<Flex justify="space-between" align="center">
					<strong>{title}</strong>
					{!readOnly ? (
						<Button size="small" icon={<IconPlus size={14} />} onClick={addItem}>
							Добавить
						</Button>
					) : null}
				</Flex>
			) : null}

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет записей</Typography.Text>
			) : isTableLayout ? (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey={([key]) => key}
					dataSource={entries}
					columns={[
						...columns.map((column) => ({
							title: column.label,
							key: column.key,
							width: column.width,
							render: (_: unknown, [entryKey, item]: [string, RecordItem]) =>
								renderField(
									column,
									item[column.key],
									readOnly || Boolean(isRowReadOnly?.(item)),
									(value) => updateItem(entryKey, column.key, value),
									false,
								),
						})),
						...(!readOnly
							? [
									{
										title: '',
										key: '_actions',
										width: 48,
										render: (_: unknown, [entryKey, item]: [string, RecordItem]) =>
											(canRemove?.(item) ?? true) ? (
												<Button
													type="text"
													danger
													aria-label="Удалить"
													icon={<IconTrash size={16} />}
													onClick={() => removeItem(entryKey)}
												/>
											) : null,
									},
								]
							: []),
					]}
				/>
			) : (
				entries.map(([key, item]) => (
					<RecordCollectionEntry
						key={key}
						entryKey={key}
						item={item}
						readOnly={readOnly}
						columns={columns}
						layout={layout}
						canRemove={canRemove}
						isRowReadOnly={isRowReadOnly}
						onFieldChange={updateItem}
						onRemove={removeItem}
					/>
				))
			)}
		</Flex>
	);
}
