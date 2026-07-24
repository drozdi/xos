import { Button, Flex, InputNumber, Select, Typography } from 'antd';
import { useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { useItemsQuery } from '@inccom/entities/item';
import type { ITransactionCreateItem } from '@inccom/entities/transaction';

interface TransactionItemsEditorProps {
	value?: ITransactionCreateItem[];
	items?: ITransactionCreateItem[];
	onChange?: (items: ITransactionCreateItem[]) => void;
	disabled?: boolean;
}

const emptyItem = (): ITransactionCreateItem => ({
	itemId: 0,
	quantity: '1',
	price: '0',
});

export function TransactionItemsEditor({
	value,
	items: itemsProp,
	onChange,
	disabled = false,
}: TransactionItemsEditorProps) {
	const items = value ?? itemsProp ?? [];
	const { data: itemsData } = useItemsQuery({ limit: 100, offset: 0 });

	const itemOptions = useMemo(
		() =>
			(itemsData?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.unit ? `${item.name} (${item.unit})` : item.name,
			})),
		[itemsData?.items],
	);

	function updateItem(index: number, patch: Partial<ITransactionCreateItem>) {
		onChange?.(
			items.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...patch } : item,
			),
		);
	}

	function addItem() {
		onChange?.([...items, emptyItem()]);
	}

	function removeItem(index: number) {
		onChange?.(items.filter((_, itemIndex) => itemIndex !== index));
	}

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<Typography.Text strong>Позиции чека</Typography.Text>
				<Button
					size="small"
					icon={<FiPlus size={14} />}
					onClick={addItem}
					disabled={disabled}
				>
					Добавить
				</Button>
			</Flex>
			{items.length === 0 ? (
				<Typography.Text type="secondary">
					Добавьте товары или включите ручной ввод суммы
				</Typography.Text>
			) : (
				items.map((item, index) => (
					<Flex key={index} align="flex-end" gap={8} wrap="nowrap">
						<div style={{ flex: 2 }}>
							<div style={{ marginBottom: 4 }}>Товар</div>
							<Select
								style={{ width: '100%' }}
								options={itemOptions}
								value={item.itemId ? String(item.itemId) : undefined}
								onChange={(next) =>
									updateItem(index, { itemId: next ? Number(next) : 0 })
								}
								placeholder="Выберите товар"
								showSearch
								optionFilterProp="label"
								disabled={disabled}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ marginBottom: 4 }}>Кол-во</div>
							<InputNumber
								style={{ width: '100%' }}
								value={Number(item.quantity)}
								onChange={(next) =>
									updateItem(index, { quantity: String(next ?? 0) })
								}
								min={0}
								precision={3}
								disabled={disabled}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ marginBottom: 4 }}>Цена</div>
							<InputNumber
								style={{ width: '100%' }}
								value={Number(item.price)}
								onChange={(next) =>
									updateItem(index, { price: String(next ?? 0) })
								}
								min={0}
								precision={2}
								disabled={disabled}
							/>
						</div>
						<Button
							type="text"
							danger
							onClick={() => removeItem(index)}
							disabled={disabled}
							aria-label="Удалить позицию"
							icon={<FiTrash2 size={16} />}
						/>
					</Flex>
				))
			)}
		</Flex>
	);
}
