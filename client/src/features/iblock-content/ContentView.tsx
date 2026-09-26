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
import type { ReactNode } from 'react';

import { AuthFileImage } from '@/core/api/AuthFileImage';
import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';
import { MarkdownPreview } from '@/features/markdown';

import { CONTENT_PROPS, type ContentExtraField, contentFeatures, type ContentCatalogConfig } from './contentCatalog';
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

function labelForSelect(
	field: Extract<ContentExtraField, { type: 'select' }>,
	value: string,
): string {
	return field.options.find((o) => o.value === value)?.label ?? value;
}

function renderExtraBadges(data: IblockElementDetail, fields: ContentExtraField[] | undefined): ReactNode {
	if (!fields?.length) return null;
	const values = data.PROPERTY_VALUES ?? {};
	const nodes: ReactNode[] = [];
	for (const field of fields) {
		if (field.type === 'text') {
			const v = String(scalarFromProperty(values[field.prop]) ?? '').trim();
			if (v) {
				nodes.push(
					<Text key={field.prop} size="sm">
						<Text span c="dimmed">
							{field.label}:{' '}
						</Text>
						{v}
					</Text>,
				);
			}
		} else if (field.type === 'number') {
			const n = numberFromProperty(values[field.prop]);
			if (n != null) {
				nodes.push(
					<Text key={field.prop} size="sm">
						<Text span c="dimmed">
							{field.label}:{' '}
						</Text>
						{n}
					</Text>,
				);
			}
		} else if (field.type === 'select') {
			const v = String(scalarFromProperty(values[field.prop]) ?? '').trim();
			if (v) {
				nodes.push(
					<Badge key={field.prop} variant="light">
						{field.label}: {labelForSelect(field, v)}
					</Badge>,
				);
			}
		}
	}
	if (!nodes.length) return null;
	return (
		<Stack gap={4}>
			{nodes}
		</Stack>
	);
}

interface ContentViewProps {
	data: IblockElementDetail;
	config: ContentCatalogConfig;
	onEdit?: () => void;
	onShare?: () => void;
}

/** Generic content element view (notes-style). */
export function ContentView({ data, config, onEdit, onShare }: ContentViewProps) {
	const features = contentFeatures(config);
	const values = data.PROPERTY_VALUES ?? {};
	const coverItems = features.cover
		? fileItemsFromProperty(values[CONTENT_PROPS.COVER])
		: [];
	const tags = features.tags
		? stringListFromProperty(values[CONTENT_PROPS.TAGS]).filter(Boolean)
		: [];
	const author = userLabel(data.created_by);
	const editor = userLabel(data.updated_by);

	return (
		<Stack gap="md">
			<Group justify="space-between" align="flex-start" wrap="wrap">
				<div>
					<Title order={3}>{data.name || config.entityLabel}</Title>
					{features.preview && data.preview_text ? (
						<Text size="sm" c="dimmed" mt={4}>
							{data.preview_text}
						</Text>
					) : null}
				</div>
				<Group gap="xs">
					{features.share && data.is_owner && onShare ? (
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

			{renderExtraBadges(data, config.extraFields)}

			{(author || editor) && (
				<Text size="xs" c="dimmed">
					{author ? `Автор: ${author}` : null}
					{author && editor && editor !== author ? ' · ' : null}
					{editor && editor !== author ? `Изменил: ${editor}` : null}
				</Text>
			)}

			{features.markdown ? (
				<Box>
					<MarkdownPreview content={data.detail_text || ''} variant="reading" />
				</Box>
			) : data.detail_text ? (
				<Text style={{ whiteSpace: 'pre-wrap' }}>{data.detail_text}</Text>
			) : null}
		</Stack>
	);
}

interface NoteViewProps {
	data: IblockElementDetail;
	onEdit?: () => void;
	onShare?: () => void;
}

/** @deprecated Prefer ContentView; kept for recipe-adjacent callers. */
export function NoteView({ data, onEdit, onShare }: NoteViewProps) {
	return (
		<ContentView
			data={data}
			config={{
				blockCode: 'notes',
				listAppId: 'notes',
				detailAppId: 'note',
				listTitle: 'Заметки',
				detailTitle: 'Заметка',
				entityLabel: 'Заметка',
				createLabel: 'Новая заметка',
				sectionLabel: 'Блокнот',
				storageKey: 'notes',
				codeFallback: 'note',
			}}
			onEdit={onEdit}
			onShare={onShare}
		/>
	);
}
