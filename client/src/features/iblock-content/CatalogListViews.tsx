import { ActionIcon, Badge, Card, Group, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconShare, IconTrash } from '@tabler/icons-react';

import { AuthFileImage } from '@/core/api/AuthFileImage';
import type { IblockElementListItem } from '@/core/api/endpoints/iblockApi';

import { CONTENT_PROPS, type ContentExtraField } from './contentCatalog';
import { numberFromProperty, scalarFromProperty } from './propertyValues';

export function catalogPropertyText(
	row: IblockElementListItem,
	field: Pick<ContentExtraField, 'prop' | 'type'> & {
		options?: ReadonlyArray<{ value: string; label: string }>;
	},
): string {
	const raw = row.PROPERTY_VALUES?.[field.prop] as Parameters<typeof scalarFromProperty>[0];
	const scalar = scalarFromProperty(raw);
	if (field.type === 'select' && field.options) {
		return field.options.find((option) => option.value === scalar)?.label || scalar || '—';
	}
	return scalar || '—';
}

function plainExcerpt(text: string): string {
	const plain = text.replace(/[#>*_`[\]]/g, ' ').replace(/\s+/g, ' ').trim();
	return plain || '—';
}

interface CatalogCardActions {
	canShare: boolean;
	canEdit: boolean;
	canDelete: boolean;
	onShare: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function CardActions({ canShare, canEdit, canDelete, onShare, onEdit, onDelete }: CatalogCardActions) {
	return (
		<Group gap={4} wrap="nowrap" onClick={(event) => event.stopPropagation()}>
			{canShare ? (
				<Tooltip label="Поделиться">
					<ActionIcon variant="subtle" aria-label="Поделиться" onClick={onShare}>
						<IconShare size={16} />
					</ActionIcon>
				</Tooltip>
			) : null}
			{canEdit ? (
				<Tooltip label="Редактировать">
					<ActionIcon variant="subtle" aria-label="Редактировать" onClick={onEdit}>
						<IconPencil size={16} />
					</ActionIcon>
				</Tooltip>
			) : null}
			{canDelete ? (
				<Tooltip label="Удалить">
					<ActionIcon variant="subtle" color="red" aria-label="Удалить" onClick={onDelete}>
						<IconTrash size={16} />
					</ActionIcon>
				</Tooltip>
			) : null}
		</Group>
	);
}

interface CatalogCardsProps {
	items: IblockElementListItem[];
	canEditRow: (row: IblockElementListItem) => boolean;
	canShareRow: (row: IblockElementListItem) => boolean;
	canDeleteRow: (row: IblockElementListItem) => boolean;
	onOpen: (row: IblockElementListItem) => void;
	onEdit: (row: IblockElementListItem) => void;
	onShare: (row: IblockElementListItem) => void;
	onDelete: (row: IblockElementListItem) => void;
}

export function GalleryCatalogGrid(props: CatalogCardsProps) {
	if (props.items.length === 0) {
		return <Text c="dimmed">Нет записей</Text>;
	}
	return (
		<SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
			{props.items.map((row) => {
				const caption = catalogPropertyText(row, { type: 'text', prop: CONTENT_PROPS.CAPTION });
				return (
				<Card key={row.id} withBorder padding="xs" style={{ cursor: 'pointer' }} onClick={() => props.onOpen(row)}>
					{row.cover?.id ? (
						<AuthFileImage lazy fileId={row.cover.id} alt={row.cover.name} h={120} radius="sm" fit="cover" />
					) : (
						<Text size="xs" c="dimmed" h={120}>
							Нет обложки
						</Text>
					)}
					<Group justify="space-between" mt="xs" wrap="nowrap" align="flex-start">
						<Stack gap={2} style={{ minWidth: 0 }}>
							<Text size="sm" fw={600} lineClamp={2}>
								{row.name || row.code}
							</Text>
							{caption !== '—' ? (
								<Text size="xs" c="dimmed" lineClamp={2}>
									{caption}
								</Text>
							) : null}
						</Stack>
						<CardActions
							canShare={props.canShareRow(row)}
							canEdit={props.canEditRow(row)}
							canDelete={props.canDeleteRow(row)}
							onShare={() => props.onShare(row)}
							onEdit={() => props.onEdit(row)}
							onDelete={() => props.onDelete(row)}
						/>
					</Group>
				</Card>
				);
			})}
		</SimpleGrid>
	);
}

export function ContactsCatalogCards(props: CatalogCardsProps) {
	if (props.items.length === 0) {
		return <Text c="dimmed">Нет записей</Text>;
	}
	return (
		<Stack gap="xs">
			{props.items.map((row) => (
				<Card key={row.id} withBorder padding="sm" style={{ cursor: 'pointer' }} onClick={() => props.onOpen(row)}>
					<Group justify="space-between" wrap="nowrap" align="flex-start">
						<Stack gap={2}>
							<Text fw={600}>{row.name || row.code}</Text>
							<Text size="sm">{catalogPropertyText(row, { type: 'text', prop: CONTENT_PROPS.POSITION })}</Text>
							<Text size="sm" c="dimmed">
								{catalogPropertyText(row, { type: 'text', prop: CONTENT_PROPS.PHONE })}
								{' · '}
								{catalogPropertyText(row, { type: 'text', prop: CONTENT_PROPS.EMAIL })}
							</Text>
						</Stack>
						<CardActions
							canShare={props.canShareRow(row)}
							canEdit={props.canEditRow(row)}
							canDelete={props.canDeleteRow(row)}
							onShare={() => props.onShare(row)}
							onEdit={() => props.onEdit(row)}
							onDelete={() => props.onDelete(row)}
						/>
					</Group>
				</Card>
			))}
		</Stack>
	);
}

export function FaqCatalogList(props: CatalogCardsProps) {
	if (props.items.length === 0) {
		return <Text c="dimmed">Нет записей</Text>;
	}
	return (
		<Stack gap="xs">
			{props.items.map((row) => (
				<Card key={row.id} withBorder padding="sm" style={{ cursor: 'pointer' }} onClick={() => props.onOpen(row)}>
					<Group justify="space-between" wrap="nowrap" align="flex-start">
						<Stack gap={4} style={{ minWidth: 0 }}>
							<Text fw={600}>{row.name || row.code}</Text>
							<Text size="sm" c="dimmed" lineClamp={3}>
								{plainExcerpt(row.detail_text || '')}
							</Text>
						</Stack>
						<CardActions
							canShare={props.canShareRow(row)}
							canEdit={props.canEditRow(row)}
							canDelete={props.canDeleteRow(row)}
							onShare={() => props.onShare(row)}
							onEdit={() => props.onEdit(row)}
							onDelete={() => props.onDelete(row)}
						/>
					</Group>
				</Card>
			))}
		</Stack>
	);
}

function recipeMeta(row: IblockElementListItem, difficultyOptions: ReadonlyArray<{ value: string; label: string }>) {
	const values = row.PROPERTY_VALUES ?? {};
	const prep = numberFromProperty(values[CONTENT_PROPS.PREP_MIN] as Parameters<typeof numberFromProperty>[0]);
	const cook = numberFromProperty(values[CONTENT_PROPS.COOK_MIN] as Parameters<typeof numberFromProperty>[0]);
	const servings = numberFromProperty(values[CONTENT_PROPS.SERVINGS] as Parameters<typeof numberFromProperty>[0]);
	const difficultyCode = scalarFromProperty(values[CONTENT_PROPS.DIFFICULTY] as Parameters<typeof scalarFromProperty>[0]);
	const difficulty = difficultyOptions.find((option) => option.value === difficultyCode)?.label || difficultyCode;
	const minutes = (prep ?? 0) + (cook ?? 0);
	const timeLabel = prep == null && cook == null ? null : `${minutes} мин`;
	return { difficulty, timeLabel, servings };
}

export function RecipeCatalogGrid({
	sectionLabel,
	difficultyOptions,
	...props
}: CatalogCardsProps & {
	sectionLabel: (row: IblockElementListItem) => string | null;
	difficultyOptions: ReadonlyArray<{ value: string; label: string }>;
}) {
	if (props.items.length === 0) {
		return <Text c="dimmed">Нет записей</Text>;
	}
	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
			{props.items.map((row) => {
				const meta = recipeMeta(row, difficultyOptions);
				const category = sectionLabel(row);
				return (
					<Card key={row.id} withBorder padding="sm" style={{ cursor: 'pointer' }} onClick={() => props.onOpen(row)}>
						<Group align="flex-start" wrap="nowrap">
							{row.cover?.id ? (
								<AuthFileImage lazy fileId={row.cover.id} alt={row.cover.name} h={72} w={72} radius="sm" fit="cover" />
							) : null}
							<Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
								<Group justify="space-between" wrap="nowrap" align="flex-start">
									<Text fw={600} lineClamp={2}>{row.name || row.code}</Text>
									<CardActions
										canShare={props.canShareRow(row)}
										canEdit={props.canEditRow(row)}
										canDelete={props.canDeleteRow(row)}
										onShare={() => props.onShare(row)}
										onEdit={() => props.onEdit(row)}
										onDelete={() => props.onDelete(row)}
									/>
								</Group>
								{category ? <Text size="xs" c="dimmed">{category}</Text> : null}
								<Group gap={6}>
									{meta.difficulty ? <Badge size="sm" variant="light">{meta.difficulty}</Badge> : null}
									{meta.timeLabel ? <Badge size="sm" variant="outline">{meta.timeLabel}</Badge> : null}
									{meta.servings != null ? <Badge size="sm" variant="outline">{meta.servings} порц.</Badge> : null}
								</Group>
							</Stack>
						</Group>
					</Card>
				);
			})}
		</SimpleGrid>
	);
}
