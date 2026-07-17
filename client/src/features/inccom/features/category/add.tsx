import { useTransactionCategoryCreate } from '@inccom/entities/transaction-category';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { ActionIcon, TextInput, type TextInputProps } from '@mantine/core';
import { useState } from 'react';
import { TbPlus } from 'react-icons/tb';

export function CategotyAdd({
	account_id,
	type,
	...props
}: TextInputProps & {
	account_id: ICategory['account_id'];
	type: string;
}) {
	const createMutation = useTransactionCategoryCreate();
	const [newLabel, setNewLabel] = useState('');

	async function handlerSave() {
		const label = newLabel.trim();
		if (!label) {
			notification.error('Ошибка', 'Введите название!');
			return;
		}
		try {
			await createMutation.mutateAsync({
				account_id,
				type,
				label,
			});
			setNewLabel('');
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	function handlerKeyPress({ key }: React.KeyboardEvent) {
		if (key === 'Enter') {
			void handlerSave();
		}
	}

	return (
		<TextInput
			{...props}
			value={newLabel}
			onChange={({ target }) => setNewLabel(target.value)}
			rightSection={
				<ActionIcon onClick={() => void handlerSave()} loading={createMutation.isPending}>
					<TbPlus />
				</ActionIcon>
			}
			onKeyDown={handlerKeyPress}
		/>
	);
}
