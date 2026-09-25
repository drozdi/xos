import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Group,
	Loader,
	MultiSelect,
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
import {
	CONTENT_PROPS,
	CoverField,
	IblockMarkdownEditor,
	NOTES_BLOCK_CODE,
	NoteView,
	RecipeShareModal,
	allocateUniqueElementCode,
	fileIdsFromProperty,
	patchPropertyValues,
	stringListFromProperty,
	useContentBlock,
} from '@/features/iblock-content';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateNoteForm } from './noteValidation';

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

export default function NoteApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const canCreate = canCreateIblockElement();
	const isNew = entityId === 0;
	const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
	const [shareOpen, setShareOpen] = useState(false);
	const { blockId, sectionOptions, isReady, error: blockError } = useContentBlock(NOTES_BLOCK_CODE);

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
			? 'Заметка (новая)'
			: viewData?.name
				? mode === 'view'
					? viewData.name
					: `${viewData.name} — правка`
				: `Заметка #${entityId}`,
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
				Нет прав на создание заметки
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр заметки
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
					Не удалось загрузить заметку
				</Alert>
			);
		}
		return (
			<Box p="md" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
				<NoteView
					data={viewData}
					onEdit={viewData.is_owner ? () => setMode('edit') : undefined}
					onShare={viewData.is_owner ? () => setShareOpen(true) : undefined}
				/>
				{viewData.is_owner ? (
					<RecipeShareModal
						recipe={viewData}
						title="Поделиться заметкой"
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
				title="Заметка"
				queryKey={['iblock', 'element']}
				listQueryKey={['iblock', 'elements']}
				invalidateQueryKeys={[['iblock']]}
				load={iblockElementApi.get}
				save={async (id, data) => iblockElementApi.update(id, await serializeNotePayload(data))}
				create={async (data) =>
					iblockElementApi.create(await serializeNotePayload(data, { allocateCode: true }))
				}
				remove={iblockElementApi.remove}
				initialData={initialData}
				buildNewData={buildNewData}
				validate={validateNoteForm}
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
									{(viewData?.is_owner ?? false) && (
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
					<NoteFormFields
						data={data}
						setField={setField}
						errors={errors}
						readOnly={readOnly}
						sectionOptions={sectionOptions}
						blockId={blockId}
					/>
				)}
			</MainEntityForm>
			{viewData?.is_owner ? (
				<RecipeShareModal
					recipe={viewData}
					title="Поделиться заметкой"
					opened={shareOpen}
					onClose={() => setShareOpen(false)}
					onUpdated={setViewData}
				/>
			) : null}
		</>
	);
}

async function serializeNotePayload(
	data: IblockElementDetail,
	options?: { allocateCode?: boolean },
): Promise<Record<string, unknown>> {
	const values = data.PROPERTY_VALUES ?? {};
	const tags = stringListFromProperty(values[CONTENT_PROPS.TAGS]).filter(Boolean);
	const coverIds = fileIdsFromProperty(values[CONTENT_PROPS.COVER]);
	const blockId = data.block_id;
	let code = (data.code || '').trim();
	if (options?.allocateCode || !code) {
		if (blockId == null || blockId <= 0) {
			throw new Error('Инфоблок заметок не загружен');
		}
		code = await allocateUniqueElementCode(blockId, data.name || 'note', {
			excludeElementId: data.id > 0 ? data.id : undefined,
			fallback: 'note',
		});
	}
	return {
		code,
		name: data.name,
		preview_text: data.preview_text,
		detail_text: data.detail_text,
		sort: data.sort,
		active: data.active,
		block_id: data.block_id,
		section_id: data.section_ids?.[0] ?? data.section_id,
		section_ids: data.section_ids ?? [],
		PROPERTY_VALUES: {
			[CONTENT_PROPS.COVER]: coverIds,
			[CONTENT_PROPS.TAGS]: tags,
		},
	};
}

function NoteFormFields({
	data,
	setField,
	errors,
	readOnly,
	sectionOptions,
	blockId,
}: {
	data: IblockElementDetail;
	setField: <K extends keyof IblockElementDetail>(key: K, value: IblockElementDetail[K]) => void;
	errors: Partial<Record<keyof IblockElementDetail & string, string>>;
	readOnly: boolean;
	sectionOptions: Array<{ value: string; label: string }>;
	blockId: number | null;
}) {
	const tags = useMemo(
		() => stringListFromProperty(data.PROPERTY_VALUES?.[CONTENT_PROPS.TAGS]),
		[data.PROPERTY_VALUES],
	);

	useEffect(() => {
		if (blockId && data.block_id == null) {
			setField('block_id', blockId);
		}
	}, [blockId, data.block_id, setField]);

	return (
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
				label="Блокноты"
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
			<CoverField
				values={data.PROPERTY_VALUES}
				readOnly={readOnly}
				multiple
				onChange={(next) => setField('PROPERTY_VALUES', next)}
			/>
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
			<Textarea
				label="Анонс"
				value={data.preview_text ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('preview_text', e.currentTarget.value)}
				minRows={2}
			/>
			<IblockMarkdownEditor
				label="Текст (Markdown)"
				value={data.detail_text ?? ''}
				readOnly={readOnly}
				onChange={(next) => setField('detail_text', next)}
				minHeight={360}
			/>
		</Stack>
	);
}
