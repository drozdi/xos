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
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { useWindowSize } from '@/core/windowManager';
import { nextTempId } from '@/features/device/deviceAppUtils';

type RecordItem = Record<string, unknown>;

interface RecordCollectionEditorProps {
	title?: string;
	records: Record<string, RecordItem>;
	readOnly: boolean;
	columns: Array<{
		key: string;
		label: string;
		type?: 'text' | 'textarea' | 'checkbox';
		width?: number | string;
	}>;
	onChange: (records: Record<string, RecordItem>) => void;
	createItem?: () => RecordItem;
	tableMinWidth?: number;
}

function useTableLayout(windowWidth: number, tableMinWidth: number): boolean {
	return windowWidth >= tableMinWidth;
}

interface RecordCollectionEntryProps {
	entryKey: string;
	item: RecordItem;
	readOnly: boolean;
	columns: RecordCollectionEditorProps['columns'];
	layout: 'table' | 'card';
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
	if (column.type === 'textarea') {
		return (
			<Textarea
				label={withLabel ? column.label : undefined}
				value={String(value ?? '')}
				readOnly={readOnly}
				onChange={(e) => onChange(e.currentTarget.value)}
				minRows={withLabel ? 2 : 1}
				autosize
			/>
		);
	}

	return (
		<TextInput
			label={withLabel ? column.label : undefined}
			value={String(value ?? '')}
			readOnly={readOnly}
			onChange={(e) => onChange(e.currentTarget.value)}
		/>
	);
}

function RecordCollectionEntry({
	entryKey,
	item,
	readOnly,
	columns,
	layout,
	onFieldChange,
	onRemove,
}: RecordCollectionEntryProps) {
	const removeButton = !readOnly ? (
		<ActionIcon
			color="red"
			variant="light"
			aria-label="Удалить"
			onClick={() => onRemove(entryKey)}
		>
			<IconTrash size={16} />
		</ActionIcon>
	) : null;

	if (layout === 'table') {
		return (
			<Table.Tr>
				{columns.map((column) => (
					<Table.Td key={column.key} w={column.width}>
						{renderField(column, item[column.key], readOnly, (value) =>
							onFieldChange(entryKey, column.key, value),
						false)}
					</Table.Td>
				))}
				{!readOnly ? <Table.Td w={48}>{removeButton}</Table.Td> : null}
			</Table.Tr>
		);
	}

	return (
		<Paper withBorder p="sm">
			<Group justify="space-between" align="flex-start" mb="xs">
				<Text fw={500} size="sm">
					{String(item.name ?? item.value ?? item.code ?? 'Запись')}
				</Text>
				{removeButton}
			</Group>
			<Stack gap="xs">
				{columns.map((column) =>
					renderField(column, item[column.key], readOnly, (value) =>
						onFieldChange(entryKey, column.key, value),
					true),
				)}
			</Stack>
		</Paper>
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
		<Stack gap="sm">
			{title ? (
				<Group justify="space-between">
					<strong>{title}</strong>
					{!readOnly ? (
						<Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
							Добавить
						</Button>
					) : null}
				</Group>
			) : null}

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет записей
				</Text>
			) : isTableLayout ? (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							{columns.map((column) => (
								<Table.Th key={column.key} w={column.width}>
									{column.label}
								</Table.Th>
							))}
							{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => (
							<RecordCollectionEntry
								key={key}
								entryKey={key}
								item={item}
								readOnly={readOnly}
								columns={columns}
								layout={layout}
								onFieldChange={updateItem}
								onRemove={removeItem}
							/>
						))}
					</Table.Tbody>
				</Table>
			) : (
				entries.map(([key, item]) => (
					<RecordCollectionEntry
						key={key}
						entryKey={key}
						item={item}
						readOnly={readOnly}
						columns={columns}
						layout={layout}
						onFieldChange={updateItem}
						onRemove={removeItem}
					/>
				))
			)}
		</Stack>
	);
}
