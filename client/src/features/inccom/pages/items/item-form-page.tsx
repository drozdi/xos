import { Button, Flex, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useItemCreate, useItemQuery, useItemUpdate } from '@inccom/entities/item';
import { defaultItem } from '@inccom/entities/item/model/defaults';
import { ItemCategoryMultiSelect } from '@inccom/features/item-filter';
import { Template } from '@inccom/layouts';

interface ItemFormValues {
	name: string;
	description: string;
	unit: string;
	categoryIds: string[];
}

function ItemCategoryMultiSelectWrapper({
	value,
	onChange,
	itemName,
}: {
	value?: string[];
	onChange?: (value: string[]) => void;
	itemName?: string;
}) {
	return (
		<ItemCategoryMultiSelect
			value={value ?? []}
			onChange={onChange ?? (() => undefined)}
			itemName={itemName}
		/>
	);
}

export function ItemFormPage() {
	const { id } = useParams();
	const itemId = id && !Number.isNaN(Number(id)) ? Number(id) : undefined;
	const isEdit = itemId !== undefined && itemId > 0;
	const navigate = useNavigate();
	const [form] = Form.useForm<ItemFormValues>();
	const itemName = Form.useWatch('name', form);

	const { data: item, isLoading } = useItemQuery(itemId);
	const createMutation = useItemCreate();
	const updateMutation = useItemUpdate();

	useEffect(() => {
		if (item && isEdit) {
			form.setFieldsValue({
				name: item.name,
				description: item.description ?? '',
				unit: item.unit ?? '',
				categoryIds: item.categoryIds.map(String),
			});
		}
	}, [item, isEdit, form]);

	async function handleSubmit(values: ItemFormValues) {
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
		return <Spin />;
	}

	return (
		<>
			<Template.Title>{isEdit ? 'Редактирование товара' : 'Новый товар'}</Template.Title>
			<Form
				form={form}
				layout="vertical"
				style={{ maxWidth: 480 }}
				onFinish={(v) => void handleSubmit(v)}
				initialValues={{
					name: defaultItem.name,
					description: defaultItem.description ?? '',
					unit: defaultItem.unit ?? '',
					categoryIds: [] as string[],
				}}
			>
				<Form.Item
					label="Название"
					name="name"
					rules={[{ required: true, message: 'Введите название' }]}
				>
					<Input />
				</Form.Item>
				<Form.Item label="Описание" name="description">
					<Input.TextArea rows={3} />
				</Form.Item>
				<Form.Item label="Ед. изм." name="unit">
					<Input />
				</Form.Item>
				<Form.Item name="categoryIds">
					<ItemCategoryMultiSelectWrapper itemName={itemName} />
				</Form.Item>
				<Flex gap={8}>
					<Button
						type="primary"
						htmlType="submit"
						loading={createMutation.isPending || updateMutation.isPending}
					>
						Сохранить
					</Button>
					<Button onClick={() => navigate('/items')}>Отмена</Button>
				</Flex>
			</Form>
		</>
	);
}
