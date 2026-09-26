import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Group,
	Loader,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	TagsInput,
	TextInput,
	Textarea,
} from '@mantine/core';
import { IconArrowLeft, IconShare } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
	iblockElementApi,
	type IblockElementDetail,
} from '@/core/api/endpoints/iblockApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	canCreateIblockElement,
	useCanDeleteIblockElement,
	useCanReadIblockElement,
	useCanUpdateIblockElement,
} from '@/features/iblock/iblockAccess';
import { useEntityId, useIblockLaunchProps } from '@/features/iblock/iblockAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import {
	CONTENT_PROPS,
	type ContentCatalogConfig,
	contentFeatures,
} from './contentCatalog';
import { ContentView } from './ContentView';
import { CoverField } from './CoverField';
import { IblockMarkdownEditor } from './IblockMarkdownEditor';
import { allocateUniqueElementCode } from './allocateUniqueElementCode';
import {
	fileIdsFromProperty,
	numberFromProperty,
	patchPropertyValues,
	scalarFromProperty,
	stringListFromProperty,
} from './propertyValues';
import { RecipeShareModal } from './RecipeShareModal';
import { useContentBlock } from './useContentBlock';

const initialData: IblockElementDetail = {
	id: 0,
	code: '',
	name: '',
	description: '',
	preview_text: '',
	detail_text: '',
	preview_image: null,
	detail_image: null,
	preview_image_id: null,
	detail_image_id: null,
	sort: 0,
	active: true,
	active_from: '',
	active_to: '',
	block_id: null,
	section_id: null,
	section_ids: [],
	PROPERTY_VALUES: {},
	x_timestamp: '',
	date_created: '',
	created_by: null,
	updated_by: null,
	is_owner: false,
	can_write: true,
	is_shared: false,
	shares: [],
};

function validateContentForm(
	data: IblockElementDetail,
): Partial<Record<keyof IblockElementDetail & string, string>> {
	const errors: Partial<Record<keyof IblockElementDetail & string, string>> = {};
	if (!data.name?.trim()) {
		errors.name = 'Укажите название';
	}
	if (!data.block_id) {
		errors.block_id = 'Инфоблок не загружен';
	}
	return errors;
}

async function serializeContentPayload(
	data: IblockElementDetail,
	config: ContentCatalogConfig,
	options?: { allocateCode?: boolean },
): Promise<Record<string, unknown>> {
	const features = contentFeatures(config);
	const values = data.PROPERTY_VALUES ?? {};
	const propertyValues: Record<string, unknown> = {};

	if (features.cover) {
		propertyValues[CONTENT_PROPS.COVER] = fileIdsFromProperty(values[CONTENT_PROPS.COVER]);
	}
	if (features.tags) {
		propertyValues[CONTENT_PROPS.TAGS] = stringListFromProperty(values[CONTENT_PROPS.TAGS]).filter(
			Boolean,
		);
	}
	for (const field of config.extraFields ?? []) {
		if (field.type === 'text') {
			propertyValues[field.prop] = String(scalarFromProperty(values[field.prop]) ?? '').trim();
		} else if (field.type === 'number') {
			propertyValues[field.prop] = numberFromProperty(values[field.prop]);
		} else if (field.type === 'select') {
			propertyValues[field.prop] = String(scalarFromProperty(values[field.prop]) ?? '').trim();
		}
	}

	const blockId = data.block_id;
	let code = (data.code || '').trim();
	if (options?.allocateCode || !code) {
		if (blockId == null || blockId <= 0) {
			throw new Error('Инфоблок не загружен');
		}
		code = await allocateUniqueElementCode(blockId, data.name || config.codeFallback, {
			excludeElementId: data.id > 0 ? data.id : undefined,
			fallback: config.codeFallback,
		});
	}
	return {
		code,
		name: data.name,
		preview_text: features.preview ? data.preview_text : '',
		detail_text: features.markdown ? data.detail_text : data.detail_text,
		sort: data.sort,
		active: data.active,
		block_id: data.block_id,
		section_id: data.section_ids?.[0] ?? data.section_id,
		section_ids: data.section_ids ?? [],
		PROPERTY_VALUES: propertyValues,
	};
}

export function ContentCatalogDetailApp({ config }: { config: ContentCatalogConfig }) {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const canCreate = canCreateIblockElement();
	const isNew = entityId === 0;
	const features = contentFeatures(config);
	const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
	const [shareOpen, setShareOpen] = useState(false);
	const { blockId, sectionOptions, isReady, error: blockError } = useContentBlock(config.blockCode);

	const detailQuery = useQuery({
		queryKey: ['iblock', 'element', entityId],
		queryFn: () => iblockElementApi.get(entityId),
		enabled: !isNew && canRead,
	});

	const [viewData, setViewData] = useState<IblockElementDetail | null>(null);
	useEffect(() => {
		if (detailQuery.data) {
			setViewData(detailQuery.data);
		}
	}, [detailQuery.data]);

	useWindowTitle(
		isNew
			? `${config.entityLabel} (новая)`
			: viewData?.name
				? mode === 'view'
					? viewData.name
					: `${viewData.name} — правка`
				: `${config.entityLabel} #${entityId}`,
	);

	const buildNewData = async (): Promise<IblockElementDetail> => {
		const sectionId = Number(launchProps.sectionId);
		const resolvedBlock =
			blockId ??
			(Number.isFinite(Number(launchProps.blockId)) && Number(launchProps.blockId) > 0
				? Number(launchProps.blockId)
				: null);
		return {
			...initialData,
			block_id: resolvedBlock,
			section_id: Number.isFinite(sectionId) && sectionId > 0 ? sectionId : null,
			section_ids: Number.isFinite(sectionId) && sectionId > 0 ? [sectionId] : [],
			PROPERTY_VALUES: {},
			is_owner: true,
			can_write: true,
		};
	};

	if (blockError) {
		return (
			<Alert color="yellow" title="Каталог не готов" m="md">
				{blockError}
			</Alert>
		);
	}

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр
			</Alert>
		);
	}

	if (!isNew && mode === 'view') {
		if (detailQuery.isLoading || !viewData) {
			return (
				<Center p="xl">
					<Loader size="sm" />
				</Center>
			);
		}
		if (detailQuery.isError) {
			return (
				<Alert color="red" title="Ошибка" m="md">
					Не удалось загрузить
				</Alert>
			);
		}
		return (
			<Box p="md" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
				<ContentView
					data={viewData}
					config={config}
					onEdit={viewData.is_owner ? () => setMode('edit') : undefined}
					onShare={
						features.share && viewData.is_owner ? () => setShareOpen(true) : undefined
					}
				/>
				{features.share && viewData.is_owner ? (
					<RecipeShareModal
						recipe={viewData}
						title={`Поделиться: ${config.entityLabel.toLowerCase()}`}
						opened={shareOpen}
						onClose={() => setShareOpen(false)}
						onUpdated={setViewData}
					/>
				) : null}
			</Box>
		);
	}

	const canSave =
		(isNew ? canCreate : canUpdate && (viewData?.can_write ?? true)) && isReady;
	const canRemove = !isNew && canDelete && (viewData?.is_owner ?? false);

	return (
		<>
			<MainEntityForm
				title={config.detailTitle}
				queryKey={['iblock', 'element']}
				listQueryKey={['iblock', 'elements']}
				invalidateQueryKeys={[['iblock']]}
				load={iblockElementApi.get}
				save={async (id, data) =>
					iblockElementApi.update(id, await serializeContentPayload(data, config))
				}
				create={async (data) =>
					iblockElementApi.create(
						await serializeContentPayload(data, config, { allocateCode: true }),
					)
				}
				remove={iblockElementApi.remove}
				initialData={initialData}
				buildNewData={buildNewData}
				validate={validateContentForm}
				canSave={canSave}
				canDelete={canRemove}
				headerNote={
					!isNew
						? () => (
								<Group gap="xs">
									<Button
										size="xs"
										variant="subtle"
										leftSection={<IconArrowLeft size={14} />}
										onClick={() => {
											void detailQuery.refetch().then((r) => {
												if (r.data) setViewData(r.data);
												setMode('view');
											});
										}}
									>
										К просмотру
									</Button>
									{features.share && (viewData?.is_owner ?? false) && (
										<ActionIcon
											variant="light"
											aria-label="Поделиться"
											onClick={() => setShareOpen(true)}
										>
											<IconShare size={16} />
										</ActionIcon>
									)}
								</Group>
							)
						: undefined
				}
			>
				{({ data, setField, errors, readOnly }) => (
					<ContentFormFields
						config={config}
						data={data}
						setField={setField}
						errors={errors}
						readOnly={readOnly}
						sectionOptions={sectionOptions}
						blockId={blockId}
					/>
				)}
			</MainEntityForm>
			{features.share && viewData?.is_owner ? (
				<RecipeShareModal
					recipe={viewData}
					title={`Поделиться: ${config.entityLabel.toLowerCase()}`}
					opened={shareOpen}
					onClose={() => setShareOpen(false)}
					onUpdated={setViewData}
				/>
			) : null}
		</>
	);
}

function ContentFormFields({
	config,
	data,
	setField,
	errors,
	readOnly,
	sectionOptions,
	blockId,
}: {
	config: ContentCatalogConfig;
	data: IblockElementDetail;
	setField: <K extends keyof IblockElementDetail>(key: K, value: IblockElementDetail[K]) => void;
	errors: Partial<Record<keyof IblockElementDetail & string, string>>;
	readOnly: boolean;
	sectionOptions: Array<{ value: string; label: string }>;
	blockId: number | null;
}) {
	const features = contentFeatures(config);
	const tags = useMemo(
		() => stringListFromProperty(data.PROPERTY_VALUES?.[CONTENT_PROPS.TAGS]),
		[data.PROPERTY_VALUES],
	);
	const coverMultiple =
		typeof features.cover === 'object' ? (features.cover.multiple ?? true) : true;

	useEffect(() => {
		if (blockId && data.block_id == null) {
			setField('block_id', blockId);
		}
	}, [blockId, data.block_id, setField]);

	return (
		<Stack gap="sm">
			<TextInput
				label={config.nameLabel ?? 'Название'}
				withAsterisk
				value={data.name ?? ''}
				error={errors.name}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<MultiSelect
				label={config.sectionLabel}
				data={sectionOptions}
				value={(data.section_ids ?? []).map(String)}
				disabled={readOnly}
				onChange={(selected) => {
					const ids = selected.map(Number).filter((id) => Number.isFinite(id) && id > 0);
					setField('section_ids', ids);
					setField('section_id', ids[0] ?? null);
				}}
				searchable
				clearable
			/>
			{features.cover ? (
				<CoverField
					values={data.PROPERTY_VALUES}
					readOnly={readOnly}
					multiple={coverMultiple}
					onChange={(next) => setField('PROPERTY_VALUES', next)}
				/>
			) : null}
			{features.tags ? (
				<TagsInput
					label="Теги"
					value={tags}
					disabled={readOnly}
					onChange={(next) =>
						setField(
							'PROPERTY_VALUES',
							patchPropertyValues(data.PROPERTY_VALUES, CONTENT_PROPS.TAGS, next),
						)
					}
				/>
			) : null}
			{(config.extraFields ?? []).map((field) => {
				if (field.type === 'text') {
					const value = String(
						scalarFromProperty(data.PROPERTY_VALUES?.[field.prop]) ?? '',
					);
					return (
						<TextInput
							key={field.prop}
							label={field.label}
							value={value}
							readOnly={readOnly}
							onChange={(e) =>
								setField(
									'PROPERTY_VALUES',
									patchPropertyValues(
										data.PROPERTY_VALUES,
										field.prop,
										e.currentTarget.value,
									),
								)
							}
						/>
					);
				}
				if (field.type === 'number') {
					const value = numberFromProperty(data.PROPERTY_VALUES?.[field.prop]);
					return (
						<NumberInput
							key={field.prop}
							label={field.label}
							value={value ?? ''}
							readOnly={readOnly}
							onChange={(next) =>
								setField(
									'PROPERTY_VALUES',
									patchPropertyValues(
										data.PROPERTY_VALUES,
										field.prop,
										typeof next === 'number' ? next : null,
									),
								)
							}
						/>
					);
				}
				const value = String(scalarFromProperty(data.PROPERTY_VALUES?.[field.prop]) ?? '');
				return (
					<Select
						key={field.prop}
						label={field.label}
						data={[...field.options]}
						value={value || null}
						disabled={readOnly}
						clearable
						onChange={(next) =>
							setField(
								'PROPERTY_VALUES',
								patchPropertyValues(data.PROPERTY_VALUES, field.prop, next ?? ''),
							)
						}
					/>
				);
			})}
			{features.preview ? (
				<Textarea
					label={config.previewLabel ?? 'Анонс'}
					value={data.preview_text ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('preview_text', e.currentTarget.value)}
					minRows={2}
				/>
			) : null}
			{features.markdown ? (
				<IblockMarkdownEditor
					label={config.detailTextLabel ?? 'Текст (Markdown)'}
					value={data.detail_text ?? ''}
					readOnly={readOnly}
					onChange={(next) => setField('detail_text', next)}
					minHeight={360}
				/>
			) : (
				<Textarea
					label={config.detailTextLabel ?? 'Текст'}
					value={data.detail_text ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('detail_text', e.currentTarget.value)}
					minRows={6}
				/>
			)}
		</Stack>
	);
}
