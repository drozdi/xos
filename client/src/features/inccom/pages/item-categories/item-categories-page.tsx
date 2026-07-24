import { Button, Flex, Form, Input, Select, Typography } from 'antd';

import { useItemCategoryCreate } from '@inccom/entities/item-category';
import { Template } from '@inccom/layouts';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { CategoryTreeWidget } from '@inccom/widgets';

export function ItemCategoriesPage() {
	const createMutation = useItemCategoryCreate();
	const [form] = Form.useForm<{ name: string; keywords: string[] }>();

	async function handleAdd(values: { name: string; keywords: string[] }) {
		try {
			await createMutation.mutateAsync({
				name: values.name.trim(),
				parentId: null,
				keywords: (values.keywords ?? [])
					.map((word) => word.trim())
					.filter(Boolean),
			});
			form.resetFields();
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	return (
		<>
			<Template.Title>Категории товаров</Template.Title>
			<Flex vertical gap={24}>
				<Form
					form={form}
					layout="vertical"
					onFinish={(v) => void handleAdd(v)}
					initialValues={{ name: '', keywords: [] }}
				>
					<Flex align="flex-end" gap={12} wrap="wrap">
						<Form.Item
							label="Новая категория"
							name="name"
							rules={[{ required: true, message: 'Введите название' }]}
							style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
						>
							<Input placeholder="Название" />
						</Form.Item>
						<Button type="primary" htmlType="submit" loading={createMutation.isPending}>
							Добавить
						</Button>
					</Flex>
					<Form.Item
						label="Ключевые слова"
						name="keywords"
						extra="Используются при поиске категории по названиям товаров"
						style={{ marginTop: 12 }}
					>
						<Select
							mode="tags"
							placeholder="Введите слово и нажмите Enter"
							tokenSeparators={[',']}
							style={{ width: '100%' }}
						/>
					</Form.Item>
				</Form>
				<Flex vertical gap={8}>
					<Typography.Text strong>Список категорий</Typography.Text>
					<CategoryTreeWidget />
				</Flex>
			</Flex>
		</>
	);
}
