import {
	Alert,
	Button,
	FileButton,
	Group,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	Switch,
	Text,
	TextInput,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import {
	iblockBlockApi,
	iblockElementApi,
	iblockPropertyApi,
	iblockPropertyEnumApi,
	iblockSectionApi,
	uploadIblockFile,
	type IblockElementDetail,
	type IblockPropertyDetail,
} from '@/core/api/endpoints/iblockApi';
import {
	canCreateIblockElement,
	useCanDeleteIblockElement,
	useCanReadIblockElement,
	useCanUpdateIblockElement,
} from '@/features/iblock/iblockAccess';
import { useEntityId, useIblockLaunchProps } from '@/features/iblock/iblockAppUtils';
import { IblockMarkdownEditor, IblockImageField, fileAcceptFromFileType } from '@/features/iblock-content';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateIblockElementForm } from './iblockElementValidation';

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

type PropertyValueObject = {
	id: number;
	name?: string;
	code?: string | null;
	src?: string;
};

type PropertyValue =
	| string
	| number
	| boolean
	| null
	| PropertyValueObject
	| Array<string | number | boolean | null | PropertyValueObject>;

function toIdString(value: PropertyValue | undefined): string | null {
	if (value == null || value === '') return null;
	if (Array.isArray(value)) {
		const first = value[0];
		if (first == null) return null;
		if (typeof first === 'object') return String(first.id);
		return String(first);
	}
	if (typeof value === 'object') return String(value.id);
	return String(value);
}

function toIdStringList(value: PropertyValue | undefined): string[] {
	if (value == null || value === '') return [];
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) return null;
				if (typeof item === 'object') return String(item.id);
				return String(item);
			})
			.filter((item): item is string => item != null && item !== '');
	}
	if (typeof value === 'object') return [String(value.id)];
	return [String(value)];
}

function fileDisplayName(value: PropertyValue | undefined): string {
	if (value == null || value === '') return '';
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) return null;
				if (typeof item === 'object') return item.name || String(item.id);
				return String(item);
			})
			.filter(Boolean)
			.join(', ');
	}
	if (typeof value === 'object') return value.name || String(value.id);
	return String(value);
}

function PropertyValueField({
	property,
	value,
	readOnly,
	onChange,
}: {
	property: IblockPropertyDetail;
	value: PropertyValue | undefined;
	readOnly: boolean;
	onChange: (next: PropertyValue) => void;
}) {
	const fieldType = (property.field_type ?? '').toUpperCase();
	const label = property.name || property.code || String(property.id);
	const [uploading, setUploading] = useState(false);

	const enumsQuery = useQuery({
		queryKey: ['iblock', 'propertyEnums', 'by-property', property.id],
		queryFn: () =>
			iblockPropertyEnumApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { property_id: property.id },
			}),
		enabled: fieldType === 'L',
	});

	const linkIblockId = property.link_iblock_id;

	const elementsQuery = useQuery({
		queryKey: ['iblock', 'elements', 'by-block', linkIblockId],
		queryFn: () =>
			iblockElementApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: linkIblockId },
			}),
		enabled: fieldType === 'E' && linkIblockId != null && linkIblockId > 0,
	});

	const sectionsQuery = useQuery({
		queryKey: ['iblock', 'sections', 'by-block', linkIblockId],
		queryFn: () =>
			iblockSectionApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: linkIblockId },
			}),
		enabled: fieldType === 'G' && linkIblockId != null && linkIblockId > 0,
	});

	const enumOptions = useMemo(
		() =>
			(enumsQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.name || item.code || String(item.id),
			})),
		[enumsQuery.data?.items],
	);

	const elementOptions = useMemo(
		() =>
			(elementsQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[elementsQuery.data?.items],
	);

	const sectionOptions = useMemo(
		() =>
			(sectionsQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[sectionsQuery.data?.items],
	);

	const uploadMutation = useMutation({
		mutationFn: async (files: File[]) => {
			const uploaded: PropertyValueObject[] = [];
			for (const file of files) {
				uploaded.push(await uploadIblockFile(file));
			}
			return uploaded;
		},
		onSuccess: (uploaded) => {
			if (property.multiple) {
				const prev = Array.isArray(value)
					? value.filter(
							(item): item is PropertyValueObject | number | string =>
								item != null &&
								(typeof item === 'object' ||
									typeof item === 'number' ||
									typeof item === 'string'),
						)
					: value != null && value !== ''
						? [value as PropertyValueObject | number | string]
						: [];
				onChange([...prev, ...uploaded]);
			} else {
				onChange(uploaded[0] ?? null);
			}
			notifications.show({ color: 'green', message: 'Файл загружен' });
		},
		onError: (error) => notifyApiError(error, 'Ошибка загрузки файла'),
		onSettled: () => setUploading(false),
	});

	if (fieldType === 'N') {
		return (
			<NumberInput
				label={label}
				value={
					typeof value === 'number'
						? value
						: value != null && value !== ''
							? Number(value)
							: undefined
				}
				readOnly={readOnly}
				onChange={(next) => onChange(typeof next === 'number' ? next : null)}
			/>
		);
	}

	if (fieldType === 'L') {
		if (property.multiple) {
			return (
				<MultiSelect
					label={label}
					data={enumOptions}
					value={toIdStringList(value)}
					disabled={readOnly}
					onChange={(values) => onChange(values.map(Number))}
					searchable
					clearable
				/>
			);
		}
		return (
			<Select
				label={label}
				data={enumOptions}
				value={toIdString(value)}
				readOnly={readOnly}
				onChange={(next) => onChange(next ? Number(next) : null)}
				searchable
				clearable
			/>
		);
	}

	if (fieldType === 'F') {
		const displayName = fileDisplayName(value);
		const accept = fileAcceptFromFileType(property.file_type);
		return (
			<Stack gap={4}>
				<Text size="sm" fw={500}>
					{label}
				</Text>
				{displayName ? (
					<Text size="sm" c="dimmed">
						{displayName}
					</Text>
				) : (
					<Text size="sm" c="dimmed">
						Файл не выбран
					</Text>
				)}
				{!readOnly ? (
					<Group gap="xs">
						<FileButton
							multiple={Boolean(property.multiple)}
							accept={accept}
							onChange={(payload) => {
								const files = Array.isArray(payload)
									? payload
									: payload
										? [payload]
										: [];
								if (files.length === 0) return;
								setUploading(true);
								uploadMutation.mutate(files);
							}}
						>
							{(props) => (
								<Button {...props} size="compact-sm" variant="light" loading={uploading}>
									Загрузить
								</Button>
							)}
						</FileButton>
						{value != null && value !== '' ? (
							<Button
								size="compact-sm"
								variant="subtle"
								color="red"
								onClick={() => onChange(property.multiple ? [] : null)}
							>
								Очистить
							</Button>
						) : null}
					</Group>
				) : null}
			</Stack>
		);
	}

	if (fieldType === 'E') {
		if (linkIblockId == null || linkIblockId <= 0) {
			return (
				<Text size="sm" c="dimmed">
					{label}: не указан инфоблок привязки
				</Text>
			);
		}
		if (property.multiple) {
			return (
				<MultiSelect
					label={label}
					data={elementOptions}
					value={toIdStringList(value)}
					disabled={readOnly}
					onChange={(values) => onChange(values.map(Number))}
					searchable
					clearable
				/>
			);
		}
		return (
			<Select
				label={label}
				data={elementOptions}
				value={toIdString(value)}
				readOnly={readOnly}
				onChange={(next) => onChange(next ? Number(next) : null)}
				searchable
				clearable
			/>
		);
	}

	if (fieldType === 'G') {
		if (linkIblockId == null || linkIblockId <= 0) {
			return (
				<Text size="sm" c="dimmed">
					{label}: не указан инфоблок привязки
				</Text>
			);
		}
		if (property.multiple) {
			return (
				<MultiSelect
					label={label}
					data={sectionOptions}
					value={toIdStringList(value)}
					disabled={readOnly}
					onChange={(values) => onChange(values.map(Number))}
					searchable
					clearable
				/>
			);
		}
		return (
			<Select
				label={label}
				data={sectionOptions}
				value={toIdString(value)}
				readOnly={readOnly}
				onChange={(next) => onChange(next ? Number(next) : null)}
				searchable
				clearable
			/>
		);
	}

	if (fieldType === 'S' || !fieldType) {
		return (
			<TextInput
				label={label}
				value={
					value == null || Array.isArray(value) || typeof value === 'object'
						? ''
						: String(value)
				}
				readOnly={readOnly}
				onChange={(e) => onChange(e.currentTarget.value)}
			/>
		);
	}

	return (
		<TextInput
			label={`${label} (${property.field_type})`}
			value={
				value == null || Array.isArray(value) || typeof value === 'object'
					? ''
					: String(value)
			}
			readOnly={readOnly}
			onChange={(e) => onChange(e.currentTarget.value)}
		/>
	);
}

function PropertyValuesEditor({
	blockId,
	values,
	readOnly,
	onChange,
}: {
	blockId: number | null;
	values: Record<string, PropertyValue>;
	readOnly: boolean;
	onChange: (next: Record<string, PropertyValue>) => void;
}) {
	const propertiesQuery = useQuery({
		queryKey: ['iblock', 'properties', 'for-element', blockId],
		queryFn: async () => {
			const list = await iblockPropertyApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: blockId },
			});
			return Promise.all(list.items.map((item) => iblockPropertyApi.get(item.id)));
		},
		enabled: blockId != null && blockId > 0,
	});

	const properties = propertiesQuery.data ?? [];
	if (blockId == null || blockId <= 0) {
		return (
			<Text size="sm" c="dimmed">
				Выберите инфоблок, чтобы редактировать свойства
			</Text>
		);
	}

	if (propertiesQuery.isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка свойств…
			</Text>
		);
	}

	if (properties.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				У инфоблока нет свойств
			</Text>
		);
	}

	return (
		<Stack gap="sm">
			{properties.map((property) => {
				const code = property.code || String(property.id);
				return (
					<PropertyValueField
						key={property.id}
						property={property}
						value={values[code]}
						readOnly={readOnly}
						onChange={(next) => onChange({ ...values, [code]: next })}
					/>
				);
			})}
		</Stack>
	);
}

export default function IblockElementApp() {
	const entityId = useEntityId();
	const launchProps = useIblockLaunchProps();
	const canRead = useCanReadIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();
	const canCreate = canCreateIblockElement();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;

	const blocksQuery = useQuery({
		queryKey: ['iblock', 'blocks', 'select-all'],
		queryFn: () =>
			iblockBlockApi.list({ t: 'list', limit: -1, offset: 1, filters: {} }),
	});

	const blockOptions = useMemo(
		() =>
			(blocksQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[blocksQuery.data?.items],
	);

	const buildNewData = useCallback(async (): Promise<IblockElementDetail> => {
		const blockId = Number(launchProps.blockId);
		const sectionId = Number(launchProps.sectionId);
		return {
			...initialData,
			block_id: Number.isFinite(blockId) && blockId > 0 ? blockId : null,
			section_id: Number.isFinite(sectionId) && sectionId > 0 ? sectionId : null,
			section_ids:
				Number.isFinite(sectionId) && sectionId > 0 ? [sectionId] : [],
		};
	}, [launchProps.blockId, launchProps.sectionId]);

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание элемента
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр элемента
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Элемент"
			queryKey={['iblock', 'element']}
			listQueryKey={['iblock', 'elements']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockElementApi.get}
			save={iblockElementApi.update}
			create={iblockElementApi.create}
			remove={iblockElementApi.remove}
			initialData={initialData}
			buildNewData={buildNewData}
			validate={validateIblockElementForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<ElementFormFields
					data={data}
					setField={setField}
					errors={errors}
					readOnly={readOnly}
					blockOptions={blockOptions}
				/>
			)}
		</MainEntityForm>
	);
}

function ElementFormFields({
	data,
	setField,
	errors,
	readOnly,
	blockOptions,
}: {
	data: IblockElementDetail;
	setField: <K extends keyof IblockElementDetail>(key: K, value: IblockElementDetail[K]) => void;
	errors: Partial<Record<keyof IblockElementDetail & string, string>>;
	readOnly: boolean;
	blockOptions: Array<{ value: string; label: string }>;
}) {
	const sectionsQuery = useQuery({
		queryKey: ['iblock', 'sections', 'by-block', data.block_id],
		queryFn: () =>
			iblockSectionApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: data.block_id },
			}),
		enabled: data.block_id != null && data.block_id > 0,
	});

	const sectionOptions = useMemo(
		() =>
			(sectionsQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[sectionsQuery.data?.items],
	);

	return (
		<Stack gap="sm">
			<Select
				label="Инфоблок"
				withAsterisk
				data={blockOptions}
				value={data.block_id != null ? String(data.block_id) : null}
				error={errors.block_id}
				readOnly={readOnly}
				onChange={(value) => {
					setField('block_id', value ? Number(value) : null);
					setField('section_id', null);
					setField('section_ids', []);
				}}
				searchable
				clearable
			/>
			<MultiSelect
				label="Разделы"
				description="Первый выбранный — основной (section_id)"
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
			<TextInput
				label="Код"
				withAsterisk
				value={data.code ?? ''}
				error={errors.code}
				readOnly={readOnly}
				onChange={(e) => setField('code', e.currentTarget.value)}
			/>
			<TextInput
				label="Название"
				withAsterisk
				value={data.name ?? ''}
				error={errors.name}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<TextInput
				label="Описание"
				value={data.description ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('description', e.currentTarget.value)}
			/>
			<Textarea
				label="Анонс"
				value={data.preview_text ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('preview_text', e.currentTarget.value)}
				minRows={2}
			/>
			<IblockImageField
				label="Картинка анонса"
				value={data.preview_image}
				readOnly={readOnly}
				onChange={(next) => {
					setField('preview_image', next);
					setField('preview_image_id', next?.id ?? null);
				}}
			/>
			<IblockImageField
				label="Детальная картинка"
				value={data.detail_image}
				readOnly={readOnly}
				onChange={(next) => {
					setField('detail_image', next);
					setField('detail_image_id', next?.id ?? null);
				}}
			/>
			<IblockMarkdownEditor
				label="Детальный текст (Markdown)"
				value={data.detail_text ?? ''}
				readOnly={readOnly}
				onChange={(next) => setField('detail_text', next)}
			/>
			<NumberInput
				label="Сортировка"
				value={data.sort ?? 0}
				readOnly={readOnly}
				onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
			/>
			<Switch
				label="Активен"
				checked={Boolean(data.active)}
				disabled={readOnly}
				onChange={(e) => setField('active', e.currentTarget.checked)}
			/>
			<TextInput
				label="Активен с"
				value={data.active_from ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('active_from', e.currentTarget.value)}
			/>
			<TextInput
				label="Активен по"
				value={data.active_to ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('active_to', e.currentTarget.value)}
			/>
			<Text fw={600} size="sm">
				Свойства
			</Text>
			<PropertyValuesEditor
				blockId={data.block_id}
				values={(data.PROPERTY_VALUES ?? {}) as Record<string, PropertyValue>}
				readOnly={readOnly}
				onChange={(next) => setField('PROPERTY_VALUES', next)}
			/>
		</Stack>
	);
}
