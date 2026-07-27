import { useItemsQuery } from '@inccom/entities/item';
import type { ITransactionCreateItem } from '@inccom/entities/transaction';
import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface TransactionItemsEditorProps {
	items: ITransactionCreateItem[];
	onChange: (items: ITransactionCreateItem[]) => void;
	disabled?: boolean;
}

const emptyItem = (): ITransactionCreateItem => ({
	itemId: 0,
	quantity: '1',
	price: '0',
});

export function TransactionItemsEditor({
	items,
	onChange,
	disabled = false,
}: TransactionItemsEditorProps) {
	const { data: itemsData } = useItemsQuery({ limit: 100, offset: 0 });

	const itemOptions = useMemo(
		() =>
			(itemsData?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.unit ? `${item.name} (${item.unit})` : item.name,
			})),
		[itemsData?.items],
	);

	function updateItem(
		index: number,
		patch: Partial<ITransactionCreateItem>,
	) {
		onChange(
			items.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...patch } : item,
			),
		);
	}

	function addItem() {
		onChange([...items, emptyItem()]);
	}

	function removeItem(index: number) {
		onChange(items.filter((_, itemIndex) => itemIndex !== index));
	}

	return (
		<Stack gap="sm">
			<Group justify="space-between">
				<Text fw={500}>Позиции чека</Text>
				<Button
					size="xs"
					variant="light"
					leftSection={<FiPlus size={14} />}
					onClick={addItem}
					disabled={disabled}
				>
					Добавить
				</Button>
			</Group>
			{items.length === 0 ? (
				<Text size="sm" c="dimmed">
					Добавьте товары или включите ручной ввод суммы
				</Text>
			) : (
				items.map((item, index) => (
					<Group key={index} align="flex-end" wrap="nowrap">
						<Select
							label="Товар"
							data={itemOptions}
							value={item.itemId ? String(item.itemId) : null}
							onChange={(value) =>
								updateItem(index, { itemId: value ? Number(value) : 0 })
							}
							placeholder="Выберите товар"
							searchable
							disabled={disabled}
							style={{ flex: 2 }}
						/>
						<NumberInput
							label="Кол-во"
							value={Number(item.quantity)}
							onChange={(value) =>
								updateItem(index, {
									quantity: String(value ?? 0),
								})
							}
							min={0}
							decimalScale={3}
							disabled={disabled}
							style={{ flex: 1 }}
						/>
						<NumberInput
							label="Цена"
							value={Number(item.price)}
							onChange={(value) =>
								updateItem(index, {
									price: String(value ?? 0),
								})
							}
							min={0}
							decimalScale={2}
							disabled={disabled}
							style={{ flex: 1 }}
						/>
						<ActionIcon
							variant="subtle"
							color="red"
							onClick={() => removeItem(index)}
							disabled={disabled}
							aria-label="Удалить позицию"
						>
							<FiTrash2 size={16} />
						</ActionIcon>
					</Group>
				))
			)}
		</Stack>
	);
}
