import { useItemCreate, useItemQuery, useItemUpdate } from '@inccom/entities/item';
import { defaultItem } from '@inccom/entities/item/model/defaults';
import { ItemCategoryMultiSelect } from '@inccom/features/item-filter';
import { Template } from '@inccom/layouts';
import {
	Button,
	Group,
	Loader,
	Stack,
	TextInput,
	Textarea,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ItemFormPage() {
	const { id } = useParams();
	const itemId =
		id && !Number.isNaN(Number(id)) ? Number(id) : undefined;
	const isEdit = itemId !== undefined && itemId > 0;
	const navigate = useNavigate();

	const { data: item, isLoading } = useItemQuery(itemId);
	const createMutation = useItemCreate();
	const updateMutation = useItemUpdate();

	const form = useForm({
		initialValues: {
			name: defaultItem.name,
			description: defaultItem.description ?? '',
			unit: defaultItem.unit ?? '',
			categoryIds: [] as string[],
		},
		validate: {
			name: isNotEmpty('Введите название'),
		},
	});

	useEffect(() => {
		if (item && isEdit) {
			form.setValues({
				name: item.name,
				description: item.description ?? '',
				unit: item.unit ?? '',
				categoryIds: item.categoryIds.map(String),
			});
		}
	}, [item, isEdit]);

	async function handleSubmit(values: typeof form.values) {
		const payload = {
			name: values.name,
			description: values.description || null,
			unit: values.unit || null,
			categoryIds: values.categoryIds.map(Number),
		};

		if (isEdit && itemId) {
			await updateMutation.mutateAsync({ id: itemId, ...payload });
		} else {
			await createMutation.mutateAsync(payload);
		}
		navigate('/items');
	}

	if (isEdit && isLoading) {
		return <Loader />;
	}

	return (
		<>
			<Template.Title>{isEdit ? 'Редактирование товара' : 'Новый товар'}</Template.Title>
			<Stack gap="md" maw={480}>
				<TextInput
					label="Название"
					required
					{...form.getInputProps('name')}
				/>
				<Textarea
					label="Описание"
					{...form.getInputProps('description')}
				/>
				<TextInput label="Ед. изм." {...form.getInputProps('unit')} />
				<ItemCategoryMultiSelect
					itemName={form.values.name}
					value={form.values.categoryIds}
					onChange={(categoryIds) => form.setFieldValue('categoryIds', categoryIds)}
					error={form.errors.categoryIds as string | undefined}
				/>
				<Group>
					<Button
						onClick={() => form.onSubmit(handleSubmit)()}
						loading={createMutation.isPending || updateMutation.isPending}
					>
						Сохранить
					</Button>
					<Button variant="default" onClick={() => navigate('/items')}>
						Отмена
					</Button>
				</Group>
			</Stack>
		</>
	);
}
