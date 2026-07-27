import { useAccountsQuery } from '@inccom/entities/account';
import {
	useTransactionCategoriesQuery,
	useEnumsTypeCategory,
} from '@inccom/entities/transaction-category';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import {
	Button,
	Checkbox,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { requestCategoryCopy, type ICategoryCopySkipped } from '../api/copy';

interface CategoryCopyModalProps {
	opened: boolean;
	onClose: () => void;
	defaultSourceAccountId?: number;
}

export function CategoryCopyModal({
	opened,
	onClose,
	defaultSourceAccountId,
}: CategoryCopyModalProps) {
	const [sourceAccountId, setSourceAccountId] = useState<string | null>(
		defaultSourceAccountId ? String(defaultSourceAccountId) : null,
	);
	const [targetAccountId, setTargetAccountId] = useState<string | null>(null);
	const [typeFilter, setTypeFilter] = useState<string>('expense');
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);

	const { data: accountsData } = useAccountsQuery();
	const { dataSelect: typeOptions } = useEnumsTypeCategory();
	const sourceId = sourceAccountId ? Number(sourceAccountId) : 0;

	const { data: categoriesData } = useTransactionCategoriesQuery(
		{ accountId: sourceId, limit: 100, offset: 0 },
		{ enabled: sourceId > 0 },
	);

	const accountOptions = useMemo(
		() =>
			(accountsData?.items ?? []).map((account) => ({
				value: String(account.id),
				label: account.label,
			})),
		[accountsData?.items],
	);

	const filteredCategories = useMemo(
		() =>
			(categoriesData?.items ?? []).filter(
				(category) => !typeFilter || category.type === typeFilter,
			),
		[categoriesData?.items, typeFilter],
	);

	const typeSelectOptions = typeOptions.filter((option) => option.value);

	async function handleCopy() {
		if (!sourceAccountId || !targetAccountId) {
			notification.error('Ошибка', 'Выберите исходный и целевой счёт');
			return;
		}

		if (sourceAccountId === targetAccountId) {
			notification.error('Ошибка', 'Счета должны отличаться');
			return;
		}

		if (selectedIds.length === 0) {
			notification.error('Ошибка', 'Выберите категории для копирования');
			return;
		}

		setLoading(true);
		try {
			const result = await requestCategoryCopy(Number(sourceAccountId), {
				targetAccountId: Number(targetAccountId),
				type: typeFilter as 'income' | 'expense',
				categoryIds: selectedIds,
			});

			const skippedText =
				result.skipped.length > 0
					? result.skipped
							.map((item: ICategoryCopySkipped) => `${item.name}: ${item.reason}`)
							.join('; ')
					: undefined;

			notification.success(
				`Скопировано: ${result.copied}`,
				skippedText,
			);
			onClose();
		} catch (e: unknown) {
			const error = getErrorMessage(e, 'Не удалось скопировать категории');
			notification.error('Ошибка', error);
		} finally {
			setLoading(false);
		}
	}

	function toggleCategory(id: number, checked: boolean) {
		setSelectedIds((current) =>
			checked ? [...current, id] : current.filter((itemId) => itemId !== id),
		);
	}

	return (
		<Modal opened={opened} onClose={onClose} title="Копирование категорий">
			<Stack>
				<Select
					label="Исходный счёт"
					data={accountOptions}
					value={sourceAccountId}
					onChange={(value) => {
						setSourceAccountId(value);
						setSelectedIds([]);
					}}
					placeholder="Выберите счёт"
					searchable
				/>
				<Select
					label="Целевой счёт"
					data={accountOptions}
					value={targetAccountId}
					onChange={setTargetAccountId}
					placeholder="Выберите счёт"
					searchable
				/>
				<Select
					label="Тип категорий"
					data={typeSelectOptions}
					value={typeFilter}
					onChange={(value) => {
						setTypeFilter(value ?? 'expense');
						setSelectedIds([]);
					}}
				/>
				<Text size="sm" c="dimmed">
					Категории для копирования
				</Text>
				{filteredCategories.length === 0 ? (
					<Text size="sm">Нет категорий для выбранного счёта и типа</Text>
				) : (
					filteredCategories.map((category) => (
						<Checkbox
							key={category.id}
							label={category.label}
							checked={selectedIds.includes(category.id)}
							onChange={(event) =>
								toggleCategory(category.id, event.currentTarget.checked)
							}
						/>
					))
				)}
				<Group justify="flex-end">
					<Button variant="default" onClick={onClose}>
						Отмена
					</Button>
					<Button loading={loading} onClick={handleCopy}>
						Копировать
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
