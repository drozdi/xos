import { Alert, Button, NumberInput, Select, Stack, Switch, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { iblockBlockApi, iblockTypeApi, type IblockBlockDetail } from '@/core/api/endpoints/iblockApi';
import {
	canCreateIblockBlock,
	useCanDeleteIblockBlock,
	useCanReadIblockBlock,
	useCanUpdateIblockBlock,
} from '@/features/iblock/iblockAccess';
import { useEntityId, useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateIblockBlockForm } from './iblockBlockValidation';

const initialData: IblockBlockDetail = {
	id: 0,
	code: '',
	name: '',
	description: '',
	sort: 0,
	active: true,
	sections: false,
	property: false,
	section_mode: 'tree',
	active_from: '',
	active_to: '',
	type_id: null,
	x_timestamp: '',
	date_created: '',
};

export default function IblockBlockApp() {
	const entityId = useEntityId();
	const launchApp = useLaunchIblockApp();
	const canRead = useCanReadIblockBlock();
	const canUpdate = useCanUpdateIblockBlock();
	const canDelete = useCanDeleteIblockBlock();
	const canCreate = canCreateIblockBlock();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;

	const typesQuery = useQuery({
		queryKey: ['iblock', 'types', 'select-all'],
		queryFn: () =>
			iblockTypeApi.list({ t: 'list', limit: -1, offset: 1, filters: {} }),
	});

	const typeOptions = useMemo(
		() =>
			(typesQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[typesQuery.data?.items],
	);

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание инфоблока
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр инфоблока
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Инфоблок"
			queryKey={['iblock', 'block']}
			listQueryKey={['iblock', 'blocks']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockBlockApi.get}
			save={iblockBlockApi.update}
			create={iblockBlockApi.create}
			remove={iblockBlockApi.remove}
			initialData={initialData}
			validate={validateIblockBlockForm}
			canSave={canSave}
			canDelete={canDelete}
			headerNote={({ data, isNew: isNewRecord }) =>
				!isNewRecord && data.id ? (
					<Button
						size="compact-sm"
						variant="light"
						onClick={() => launchApp('iblock-elements', 0, { blockId: data.id })}
					>
						Элементы
					</Button>
				) : null
			}
		>
			{({ data, setField, errors, readOnly }) => (
				<Stack gap="sm">
					<Select
						label="Тип"
						withAsterisk
						data={typeOptions}
						value={data.type_id != null ? String(data.type_id) : null}
						error={errors.type_id}
						readOnly={readOnly}
						onChange={(value) => setField('type_id', value ? Number(value) : null)}
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
					<Switch
						label="Разделы"
						checked={Boolean(data.sections)}
						disabled={readOnly}
						onChange={(e) => setField('sections', e.currentTarget.checked)}
					/>
					<Switch
						label="Свойства"
						checked={Boolean(data.property)}
						disabled={readOnly}
						onChange={(e) => setField('property', e.currentTarget.checked)}
					/>
					<Select
						label="Режим разделов"
						data={[
							{ value: 'bind', label: 'bind — только привязка' },
							{ value: 'tree', label: 'tree — привязка + потомки' },
							{ value: 'filter', label: 'filter — element_filter' },
							{ value: 'bind_filter', label: 'bind_filter — tree ∪ filter' },
						]}
						value={data.section_mode || 'tree'}
						readOnly={readOnly}
						onChange={(value) => setField('section_mode', value || 'tree')}
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
				</Stack>
			)}
		</MainEntityForm>
	);
}
