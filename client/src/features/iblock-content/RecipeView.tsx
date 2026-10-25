import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Stack,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { IconEdit, IconShare } from '@tabler/icons-react';

import { AuthFileImage } from '@/core/api/AuthFileImage';
import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';
import { MarkdownPreview } from '@/features/markdown';

import { CONTENT_PROPS } from './contentCatalog';
import {
	fileItemsFromProperty,
	numberFromProperty,
	scalarFromProperty,
	stringListFromProperty,
} from './propertyValues';

function userLabel(user: IblockElementDetail['created_by']): string | null {
	if (!user) return null;
	return user.alias || user.email || (user.id != null ? `#${user.id}` : null);
}

interface RecipeViewProps {
	data: IblockElementDetail;
	difficultyLabel?: string | null;
	onEdit?: () => void;
	onShare?: () => void;
}

export function RecipeView({ data, difficultyLabel, onEdit, onShare }: RecipeViewProps) {
	const values = data.PROPERTY_VALUES ?? {};
	const detailImage = data.detail_image;
	const coverItems = fileItemsFromProperty(values[CONTENT_PROPS.COVER]).filter(
		(item) => item.id !== detailImage?.id,
	);
	const ingredients = stringListFromProperty(values[CONTENT_PROPS.INGREDIENTS]).filter(Boolean);
	const prep = numberFromProperty(values[CONTENT_PROPS.PREP_MIN]);
	const cook = numberFromProperty(values[CONTENT_PROPS.COOK_MIN]);
	const servings = numberFromProperty(values[CONTENT_PROPS.SERVINGS]);
	const difficulty = difficultyLabel || scalarFromProperty(values[CONTENT_PROPS.DIFFICULTY]);
	const author = userLabel(data.created_by);
	const editor = userLabel(data.updated_by);

	return (
		<Stack gap="md">
			<Group justify="space-between" align="flex-start" wrap="wrap">
				<div>
					<Title order={3}>{data.name || 'Рецепт'}</Title>
					{data.preview_text ? (
						<Text size="sm" c="dimmed" mt={4}>
							{data.preview_text}
						</Text>
					) : null}
				</div>
				<Group gap="xs">
					{onShare ? (
						<Tooltip label="Поделиться">
							<ActionIcon variant="light" aria-label="Поделиться" onClick={onShare}>
								<IconShare size={18} />
							</ActionIcon>
						</Tooltip>
					) : null}
					{onEdit ? (
						<Button size="xs" leftSection={<IconEdit size={14} />} onClick={onEdit}>
							Редактировать
						</Button>
					) : null}
					{data.is_shared && !data.is_owner ? (
						<Badge variant="light" color="gray">
							Доступ для просмотра
						</Badge>
					) : null}
				</Group>
			</Group>

			{detailImage?.id ? (
				<AuthFileImage
					fileId={detailImage.id}
					alt={data.name || detailImage.name || 'Картинка'}
					mah={360}
					w="100%"
					fit="contain"
					radius="sm"
				/>
			) : null}

			{coverItems.length > 0 ? (
				<Box>
					<Text fw={600} mb="xs">
						Галерея
					</Text>
					<Group gap="sm" wrap="wrap">
						{coverItems.map((item) => (
							<AuthFileImage
								key={item.id}
								fileId={item.id}
								alt={data.name || item.name || 'gallery'}
								mah={200}
								fit="contain"
								radius="sm"
							/>
						))}
					</Group>
				</Box>
			) : null}

			<Group gap="sm" wrap="wrap">
				{prep != null ? <Badge variant="outline">Подготовка: {prep} мин</Badge> : null}
				{cook != null ? <Badge variant="outline">Готовка: {cook} мин</Badge> : null}
				{servings != null ? <Badge variant="outline">Порции: {servings}</Badge> : null}
				{difficulty ? <Badge variant="light">{difficulty}</Badge> : null}
			</Group>

			{(author || editor) && (
				<Text size="xs" c="dimmed">
					{author ? `Автор: ${author}` : null}
					{author && editor && editor !== author ? ' · ' : null}
					{editor && editor !== author ? `Изменил: ${editor}` : null}
				</Text>
			)}

			{ingredients.length > 0 ? (
				<Box>
					<Text fw={600} mb="xs">
						Ингредиенты
					</Text>
					<Stack gap={4}>
						{ingredients.map((line, index) => (
							<Text key={`ing-${index}`} size="sm">
								• {line}
							</Text>
						))}
					</Stack>
				</Box>
			) : null}

			<Box>
				<Text fw={600} mb="xs">
					Инструкция
				</Text>
				<MarkdownPreview content={data.detail_text || ''} variant="reading" />
			</Box>
		</Stack>
	);
}
