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
	Tabs,
	Text,
	TextInput,
	Textarea,
} from '@mantine/core';
import { IconArrowLeft, IconPlus, IconShare, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
	iblockElementApi,
	type IblockElementDetail,
} from '@/core/api/endpoints/iblockApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	canCreateRecipe,
	useCanReadRecipe,
	useCanUpdateRecipe,
} from '@/features/iblock-content/recipeAccess';
import { useEntityId, useIblockLaunchProps } from '@/features/iblock/iblockAppUtils';
import {
	CONTENT_PROPS,
	CoverField,
	IblockImageField,
	IblockMarkdownEditor,
	RECIPES_BLOCK_CODE,
	RecipeShareModal,
	RecipeView,
	allocateUniqueElementCode,
	fileIdsFromProperty,
	numberFromProperty,
	patchPropertyValues,
	scalarFromProperty,
	stringListFromProperty,
	useContentBlock,
} from '@/features/iblock-content';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateRecipeForm } from './recipeValidation';

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

export default function RecipeApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadRecipe();
	const canUpdate = useCanUpdateRecipe();
	const canCreate = canCreateRecipe();
	const isNew = entityId === 0;
	const [mode, setMode] = useState<'view' | 'edit'>(() =>
		isNew || launchProps.mode === 'edit' ? 'edit' : 'view',
	);
	const [shareOpen, setShareOpen] = useState(false);
	const {
		blockId,
		sectionOptions,
		difficultyOptions,
		resolveDifficultyCode,
		isReady,
		error: blockError,
	} = useContentBlock(RECIPES_BLOCK_CODE);

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

	useEffect(() => {
		if (isNew || mode !== 'edit' || !viewData) {
			return;
		}
		if (!(canUpdate && viewData.can_write)) {
			setMode('view');
		}
	}, [isNew, mode, viewData, canUpdate]);

	useWindowTitle(
		isNew
			? 'Рецепт (новый)'
			: viewData?.name
				? mode === 'view'
					? viewData.name
					: `${viewData.name} — правка`
				: `Рецепт #${entityId}`,
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
			PROPERTY_VALUES: {
				[CONTENT_PROPS.DIFFICULTY]: 'easy',
				[CONTENT_PROPS.INGREDIENTS]: [''],
			},
			is_owner: true,
			can_write: true,
		};
	};

	const difficultyLabel = useMemo(() => {
		if (!viewData) return null;
		const code = resolveDifficultyCode(viewData.PROPERTY_VALUES?.[CONTENT_PROPS.DIFFICULTY]);
		return difficultyOptions.find((o) => o.value === code)?.label ?? code;
	}, [viewData, resolveDifficultyCode, difficultyOptions]);

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
				Нет прав на создание рецепта
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр рецепта
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
					Не удалось загрузить рецепт
				</Alert>
			);
		}
		return (
			<Box p="md" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
				<RecipeView
					data={viewData}
					difficultyLabel={difficultyLabel}
					onEdit={
						canUpdate && viewData.can_write ? () => setMode('edit') : undefined
					}
					onShare={viewData.is_owner ? () => setShareOpen(true) : undefined}
				/>
				{viewData.is_owner ? (
					<RecipeShareModal
						recipe={viewData}
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

	const goToView = async () => {
		const result = await detailQuery.refetch();
		if (result.data) {
			setViewData(result.data);
		}
		setMode('view');
	};

	return (
		<>
			<MainEntityForm
				title="Рецепт"
				queryKey={['iblock', 'element']}
				listQueryKey={['iblock', 'elements']}
				invalidateQueryKeys={[['iblock']]}
				load={iblockElementApi.get}
				save={async (id, data) => iblockElementApi.update(id, await serializeRecipePayload(data))}
				create={async (data) =>
					iblockElementApi.create(await serializeRecipePayload(data, { allocateCode: true }))
				}
				initialData={initialData}
				buildNewData={buildNewData}
				validate={validateRecipeForm}
				canSave={canSave}
				canDelete={false}
				autoSaveMs={3000}
				headerActions={
					!isNew
						? ({ flushSave }) => (
								<>
									<Button
										size="xs"
										variant="default"
										leftSection={<IconArrowLeft size={14} />}
										onClick={() => {
											void flushSave().then(() => goToView());
										}}
									>
										Просмотр
									</Button>
									{(viewData?.is_owner ?? false) ? (
										<ActionIcon
											variant="light"
											aria-label="Поделиться"
											onClick={() => setShareOpen(true)}
										>
											<IconShare size={16} />
										</ActionIcon>
									) : null}
								</>
							)
						: undefined
				}
			>
				{({ data, setField, errors, readOnly }) => (
					<RecipeFormFields
						data={data}
						setField={setField}
						errors={errors}
						readOnly={readOnly}
						sectionOptions={sectionOptions}
						difficultyOptions={difficultyOptions}
						resolveDifficultyCode={resolveDifficultyCode}
						blockId={blockId}
					/>
				)}
			</MainEntityForm>
			{viewData?.is_owner ? (
				<RecipeShareModal
					recipe={viewData}
					opened={shareOpen}
					onClose={() => setShareOpen(false)}
					onUpdated={setViewData}
				/>
			) : null}
		</>
	);
}

async function serializeRecipePayload(
	data: IblockElementDetail,
	options?: { allocateCode?: boolean },
): Promise<Record<string, unknown>> {
	const values = data.PROPERTY_VALUES ?? {};
	const ingredients = stringListFromProperty(values[CONTENT_PROPS.INGREDIENTS]).filter(Boolean);
	const coverIds = fileIdsFromProperty(values[CONTENT_PROPS.COVER]);
	const blockId = data.block_id;
	let code = (data.code || '').trim();
	if (options?.allocateCode || !code) {
		if (blockId == null || blockId <= 0) {
			throw new Error('Инфоблок рецептов не загружен');
		}
		code = await allocateUniqueElementCode(blockId, data.name || 'recipe', {
			excludeElementId: data.id > 0 ? data.id : undefined,
			fallback: 'recipe',
		});
	}
	return {
		code,
		name: data.name,
		preview_text: data.preview_text,
		detail_text: data.detail_text,
		detail_image: data.detail_image,
		detail_image_id: data.detail_image?.id ?? data.detail_image_id ?? null,
		sort: data.sort,
		active: data.active,
		block_id: data.block_id,
		section_id: data.section_ids?.[0] ?? data.section_id,
		section_ids: data.section_ids ?? [],
		PROPERTY_VALUES: {
			[CONTENT_PROPS.COVER]: coverIds,
			[CONTENT_PROPS.PREP_MIN]: numberFromProperty(values[CONTENT_PROPS.PREP_MIN]),
			[CONTENT_PROPS.COOK_MIN]: numberFromProperty(values[CONTENT_PROPS.COOK_MIN]),
			[CONTENT_PROPS.SERVINGS]: numberFromProperty(values[CONTENT_PROPS.SERVINGS]),
			[CONTENT_PROPS.DIFFICULTY]: scalarFromProperty(values[CONTENT_PROPS.DIFFICULTY]) || null,
			[CONTENT_PROPS.INGREDIENTS]: ingredients,
		},
	};
}

function RecipeFormFields({
	data,
	setField,
	errors,
	readOnly,
	sectionOptions,
	difficultyOptions,
	resolveDifficultyCode,
	blockId,
}: {
	data: IblockElementDetail;
	setField: <K extends keyof IblockElementDetail>(key: K, value: IblockElementDetail[K]) => void;
	errors: Partial<Record<keyof IblockElementDetail & string, string>>;
	readOnly: boolean;
	sectionOptions: Array<{ value: string; label: string }>;
	difficultyOptions: Array<{ value: string; label: string }>;
	resolveDifficultyCode: (raw: unknown) => string | null;
	blockId: number | null;
}) {
	const values = data.PROPERTY_VALUES ?? {};
	const [activeTab, setActiveTab] = useState<string | null>('general');
	const ingredients = useMemo(() => {
		const list = stringListFromProperty(values[CONTENT_PROPS.INGREDIENTS]);
		return list.length > 0 ? list : [''];
	}, [values[CONTENT_PROPS.INGREDIENTS]]);

	useEffect(() => {
		if (blockId && data.block_id == null) {
			setField('block_id', blockId);
		}
	}, [blockId, data.block_id, setField]);

	const setProp = (code: string, next: IblockElementDetail['PROPERTY_VALUES'][string]) => {
		setField('PROPERTY_VALUES', patchPropertyValues(data.PROPERTY_VALUES, code, next));
	};

	const addIngredient = () => {
		const current = stringListFromProperty(values[CONTENT_PROPS.INGREDIENTS]);
		const base = current.length > 0 ? current : [''];
		setProp(CONTENT_PROPS.INGREDIENTS, [...base, '']);
	};

	return (
		<Tabs value={activeTab} onChange={setActiveTab}>
			<Tabs.List>
				<Tabs.Tab value="general">Основное</Tabs.Tab>
				<Tabs.Tab value="instructions">Инструкция</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value="general" pt="sm">
				<Stack gap="sm">
					<TextInput
						label="Название"
						withAsterisk
						value={data.name ?? ''}
						error={errors.name}
						readOnly={readOnly}
						onChange={(e) => setField('name', e.currentTarget.value)}
					/>
					<MultiSelect
						label="Категории"
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
					<IblockImageField
						label="Картинка"
						value={data.detail_image}
						readOnly={readOnly}
						onChange={(next) => {
							setField('detail_image', next);
							setField('detail_image_id', next?.id ?? null);
						}}
					/>
					<CoverField
						values={data.PROPERTY_VALUES}
						readOnly={readOnly}
						multiple
						label="Галерея"
						emptyLabel="Нет фото в галерее"
						onChange={(next) => setField('PROPERTY_VALUES', next)}
					/>
					<Group grow>
						<NumberInput
							label="Подготовка (мин)"
							value={numberFromProperty(values[CONTENT_PROPS.PREP_MIN]) ?? undefined}
							readOnly={readOnly}
							min={0}
							onChange={(v) => setProp(CONTENT_PROPS.PREP_MIN, typeof v === 'number' ? v : null)}
						/>
						<NumberInput
							label="Готовка (мин)"
							value={numberFromProperty(values[CONTENT_PROPS.COOK_MIN]) ?? undefined}
							readOnly={readOnly}
							min={0}
							onChange={(v) => setProp(CONTENT_PROPS.COOK_MIN, typeof v === 'number' ? v : null)}
						/>
						<NumberInput
							label="Порции"
							value={numberFromProperty(values[CONTENT_PROPS.SERVINGS]) ?? undefined}
							readOnly={readOnly}
							min={0}
							onChange={(v) => setProp(CONTENT_PROPS.SERVINGS, typeof v === 'number' ? v : null)}
						/>
					</Group>
					<Select
						label="Сложность"
						data={difficultyOptions}
						value={resolveDifficultyCode(values[CONTENT_PROPS.DIFFICULTY])}
						disabled={readOnly}
						onChange={(v) => setProp(CONTENT_PROPS.DIFFICULTY, v)}
						clearable
					/>
					<Stack gap="xs">
						<Group justify="space-between">
							<Text size="sm" fw={500}>
								Ингредиенты
							</Text>
							{!readOnly && (
								<Button
									size="xs"
									variant="light"
									leftSection={<IconPlus size={14} />}
									onClick={addIngredient}
								>
									Добавить
								</Button>
							)}
						</Group>
						{ingredients.map((line, index) => (
							<Group key={`ing-${index}`} gap="xs" wrap="nowrap">
								<TextInput
									style={{ flex: 1 }}
									value={line}
									readOnly={readOnly}
									placeholder="например: мука — 200 г"
									onChange={(e) => {
										const next = [...ingredients];
										next[index] = e.currentTarget.value;
										setProp(CONTENT_PROPS.INGREDIENTS, next);
									}}
								/>
								{!readOnly && ingredients.length > 1 && (
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() =>
											setProp(
												CONTENT_PROPS.INGREDIENTS,
												ingredients.filter((_, i) => i !== index),
											)
										}
									>
										<IconTrash size={16} />
									</ActionIcon>
								)}
							</Group>
						))}
					</Stack>
					<Textarea
						label="Анонс"
						value={data.preview_text ?? ''}
						readOnly={readOnly}
						onChange={(e) => setField('preview_text', e.currentTarget.value)}
						minRows={2}
					/>
				</Stack>
			</Tabs.Panel>

			<Tabs.Panel value="instructions" pt="sm">
				<IblockMarkdownEditor
					label="Инструкция (Markdown)"
					value={data.detail_text ?? ''}
					readOnly={readOnly}
					onChange={(next) => setField('detail_text', next)}
					minHeight={420}
				/>
			</Tabs.Panel>
		</Tabs>
	);
}
