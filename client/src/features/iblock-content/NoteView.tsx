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
import { fileItemsFromProperty, stringListFromProperty } from './propertyValues';

function userLabel(user: IblockElementDetail['created_by']): string | null {
	if (!user) return null;
	return user.alias || user.email || (user.id != null ? `#${user.id}` : null);
}

interface NoteViewProps {
	data: IblockElementDetail;
	onEdit?: () => void;
	onShare?: () => void;
}

export function NoteView({ data, onEdit, onShare }: NoteViewProps) {
	const values = data.PROPERTY_VALUES ?? {};
	const coverItems = fileItemsFromProperty(values[CONTENT_PROPS.COVER]);
	const tags = stringListFromProperty(values[CONTENT_PROPS.TAGS]).filter(Boolean);
	const author = userLabel(data.created_by);
	const editor = userLabel(data.updated_by);

	return (
		<Stack gap="md">
			<Group justify="space-between" align="flex-start" wrap="wrap">
				<div>
					<Title order={3}>{data.name || 'Заметка'}</Title>
					{data.preview_text ? (
						<Text size="sm" c="dimmed" mt={4}>
							{data.preview_text}
						</Text>
					) : null}
				</div>
				<Group gap="xs">
					{data.is_owner && onShare ? (
						<Tooltip label="Поделиться">
							<ActionIcon variant="light" aria-label="Поделиться" onClick={onShare}>
								<IconShare size={18} />
							</ActionIcon>
						</Tooltip>
					) : null}
					{data.is_owner && onEdit ? (
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

			{coverItems.length > 0 ? (
				<Group gap="sm" wrap="wrap">
					{coverItems.map((item) => (
						<AuthFileImage
							key={item.id}
							fileId={item.id}
							alt={data.name || item.name || 'cover'}
							mah={280}
							fit="contain"
							radius="sm"
						/>
					))}
				</Group>
			) : null}

			{tags.length > 0 ? (
				<Group gap="xs" wrap="wrap">
					{tags.map((tag) => (
						<Badge key={tag} variant="light">
							{tag}
						</Badge>
					))}
				</Group>
			) : null}

			{(author || editor) && (
				<Text size="xs" c="dimmed">
					{author ? `Автор: ${author}` : null}
					{author && editor && editor !== author ? ' · ' : null}
					{editor && editor !== author ? `Изменил: ${editor}` : null}
				</Text>
			)}

			<Box>
				<MarkdownPreview content={data.detail_text || ''} variant="reading" />
			</Box>
		</Stack>
	);
}
