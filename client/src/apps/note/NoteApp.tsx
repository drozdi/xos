import {
	Alert,
	MultiSelect,
	Stack,
	TagsInput,
	TextInput,
	Textarea,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';

import {
	iblockElementApi,
	type IblockElementDetail,
} from '@/core/api/endpoints/iblockApi';
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
	fileIdFromProperty,
	patchPropertyValues,
	slugifyCode,
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
};

export default function NoteApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const canCreate = canCreateIblockElement();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;
	const { blockId, sectionOptions, isReady, error: blockError } = useContentBlock(NOTES_BLOCK_CODE);

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

	return (
		<MainEntityForm
			title="Заметка"
			queryKey={['iblock', 'element']}
			listQueryKey={['iblock', 'elements']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockElementApi.get}
			save={async (id, data) => iblockElementApi.update(id, serializeNotePayload(data))}
			create={async (data) => iblockElementApi.create(serializeNotePayload(data))}
			remove={iblockElementApi.remove}
			initialData={initialData}
			buildNewData={buildNewData}
			validate={validateNoteForm}
			canSave={canSave && isReady}
			canDelete={canDelete}
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
	);
}

function serializeNotePayload(data: IblockElementDetail): Record<string, unknown> {
	const tags = stringListFromProperty(data.PROPERTY_VALUES?.[CONTENT_PROPS.TAGS]);
	const coverId = fileIdFromProperty(data.PROPERTY_VALUES?.[CONTENT_PROPS.COVER]);
	return {
		code: data.code || slugifyCode(data.name || 'note'),
		name: data.name,
		preview_text: data.preview_text,
		detail_text: data.detail_text,
		sort: data.sort,
		active: data.active,
		block_id: data.block_id,
		section_id: data.section_ids?.[0] ?? data.section_id,
		section_ids: data.section_ids ?? [],
		PROPERTY_VALUES: {
			[CONTENT_PROPS.COVER]: coverId,
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
				onChange={(e) => {
					const name = e.currentTarget.value;
					setField('name', name);
					if (!data.id) {
						setField('code', slugifyCode(name));
					}
				}}
			/>
			<TextInput
				label="Код"
				value={data.code ?? ''}
				error={errors.code}
				readOnly={readOnly}
				onChange={(e) => setField('code', e.currentTarget.value)}
			/>
			<MultiSelect
				label="Блокноты"
				data={sectionOptions}
				value={(data.section_ids ?? []).map(String)}
				disabled={readOnly}
				onChange={(values) => {
					const ids = values.map(Number).filter((id) => Number.isFinite(id) && id > 0);
					setField('section_ids', ids);
					setField('section_id', ids[0] ?? null);
				}}
				searchable
				clearable
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
			<CoverField
				values={data.PROPERTY_VALUES}
				readOnly={readOnly}
				onChange={(next) => setField('PROPERTY_VALUES', next)}
			/>
			<Textarea
				label="Анонс"
				value={data.preview_text ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('preview_text', e.currentTarget.value)}
				minRows={2}
			/>
			<IblockMarkdownEditor
				value={data.detail_text ?? ''}
				readOnly={readOnly}
				onChange={(next) => setField('detail_text', next)}
			/>
		</Stack>
	);
}
