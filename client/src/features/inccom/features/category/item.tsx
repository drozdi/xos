import {
	useTransactionCategoryDelete,
	useTransactionCategoryUpdate,
} from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { ActionIcon, Group, Text, TextInput, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { TbFileDots, TbFileLike, TbX } from 'react-icons/tb';

export function CategotyItem({ category }: { category: ICategory }) {
	const updateMutation = useTransactionCategoryUpdate();
	const deleteMutation = useTransactionCategoryDelete();
	const { userData } = useStoreUserProfile();
	const [isEdit, setEdit] = useState(false);
	const isAction = category.owner_id === userData?.id;
	const [label, setLabel] = useState<string>(category.label);

	const isSaving = updateMutation.isPending || deleteMutation.isPending;

	async function handlerSave() {
		try {
			await updateMutation.mutateAsync({
				id: category.id,
				label: label.trim(),
			});
			setEdit(false);
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	function handlerKeyPress({ key }: React.KeyboardEvent) {
		if (key === 'Enter') {
			void handlerSave();
		}
	}

	async function handlerRemove(categoryToRemove: ICategory) {
		try {
			await deleteMutation.mutateAsync(categoryToRemove.id);
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	return (
		<Group>
			{isEdit && isAction ? (
				<>
					<TextInput
						flex="1"
						value={label}
						onChange={({ target }) => setLabel(target.value)}
						onKeyDown={handlerKeyPress}
					/>
					<ActionIcon
						loading={isSaving}
						color="green"
						onClick={() => void handlerSave()}
					>
						<TbFileLike />
					</ActionIcon>
				</>
			) : (
				<Text flex="1">{label}</Text>
			)}
			{isAction && !isEdit && (
				<Group>
					<Tooltip label="Переиминовать">
						<ActionIcon
							loading={isSaving}
							color="yellow"
							onClick={() => {
								setLabel(category.label);
								setEdit(true);
							}}
						>
							<TbFileDots />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Удалить">
						<ActionIcon
							loading={isSaving}
							color="red"
							onClick={() => void handlerRemove(category)}
						>
							<TbX />
						</ActionIcon>
					</Tooltip>
				</Group>
			)}
		</Group>
	);
}
