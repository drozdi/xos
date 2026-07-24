import { Button, Flex, Input, Tooltip, Typography } from 'antd';
import { CloseOutlined, FileDoneOutlined, FileOutlined } from '@ant-design/icons';
import { useState } from 'react';

import {
	useTransactionCategoryDelete,
	useTransactionCategoryUpdate,
} from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';

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
		<Flex align="center" gap={8} style={{ width: '100%' }}>
			{isEdit && isAction ? (
				<>
					<Input
						style={{ flex: 1 }}
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						onKeyDown={handlerKeyPress}
					/>
					<Button
						type="primary"
						loading={isSaving}
						icon={<FileDoneOutlined />}
						onClick={() => void handlerSave()}
					/>
				</>
			) : (
				<Typography.Text style={{ flex: 1 }}>{label}</Typography.Text>
			)}
			{isAction && !isEdit ? (
				<Flex gap={4}>
					<Tooltip title="Переиминовать">
						<Button
							loading={isSaving}
							icon={<FileOutlined />}
							onClick={() => {
								setLabel(category.label);
								setEdit(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Удалить">
						<Button
							danger
							loading={isSaving}
							icon={<CloseOutlined />}
							onClick={() => void handlerRemove(category)}
						/>
					</Tooltip>
				</Flex>
			) : null}
		</Flex>
	);
}
