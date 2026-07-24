import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';

import { useTransactionCategoryCreate } from '@inccom/entities/transaction-category';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';

export function CategotyAdd({
	account_id,
	type,
}: {
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
		<Input
			value={newLabel}
			onChange={(e) => setNewLabel(e.target.value)}
			onKeyDown={handlerKeyPress}
			addonAfter={
				<Button
					type="text"
					icon={<PlusOutlined />}
					loading={createMutation.isPending}
					onClick={() => void handlerSave()}
				/>
			}
		/>
	);
}
