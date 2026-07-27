import { useItemCategoryCreate } from '@inccom/entities/item-category';
import { Template } from '@inccom/layouts';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { notification } from '@inccom/shared/notification';
import { CategoryTreeWidget } from '@inccom/widgets';
import { Button, Group, Stack, TagsInput, Text, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';

export function ItemCategoriesPage() {
	const createMutation = useItemCategoryCreate();

	const form = useForm({
		initialValues: { name: '', keywords: [] as string[] },
		validate: {
			name: isNotEmpty('Введите название'),
		},
	});

	async function handleAdd(values: { name: string; keywords: string[] }) {
		try {
			await createMutation.mutateAsync({
				name: values.name.trim(),
				parentId: null,
				keywords: values.keywords.map((word) => word.trim()).filter(Boolean),
			});
			form.reset();
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	return (
		<>
			<Template.Title>Категории товаров</Template.Title>
			<Stack gap="lg">
				<form onSubmit={form.onSubmit(handleAdd)}>
					<Stack gap="sm">
						<Group align="flex-end" wrap="wrap">
							<TextInput
								label="Новая категория"
								placeholder="Название"
								style={{ flex: 1, minWidth: 200 }}
								required
								{...form.getInputProps('name')}
							/>
							<Button type="submit" loading={createMutation.isPending}>
								Добавить
							</Button>
						</Group>
						<TagsInput
							label="Ключевые слова"
							description="Используются при поиске категории по названиям товаров"
							placeholder="Введите слово и нажмите Enter"
							{...form.getInputProps('keywords')}
						/>
					</Stack>
				</form>
				<Stack gap="xs">
					<Text fw={500}>Список категорий</Text>
					<CategoryTreeWidget />
				</Stack>
			</Stack>
		</>
	);
}