import { Alert, NumberInput, Stack, Switch, TextInput } from '@mantine/core';

import { iblockTypeApi, type IblockTypeDetail } from '@/core/api/endpoints/iblockApi';
import {
	canCreateIblockType,
	useCanDeleteIblockType,
	useCanReadIblockType,
	useCanUpdateIblockType,
} from '@/features/iblock/iblockAccess';
import { useEntityId } from '@/features/iblock/iblockAppUtils';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import { validateIblockTypeForm } from './iblockTypeValidation';

const initialData: IblockTypeDetail = {
	id: 0,
	code: '',
	name: '',
	description: '',
	sort: 0,
	active: true,
	sections: false,
	active_from: '',
	active_to: '',
	parent_id: null,
	x_timestamp: '',
};

export default function IblockTypeApp() {
	const entityId = useEntityId();
	const canRead = useCanReadIblockType();
	const canUpdate = useCanUpdateIblockType();
	const canDelete = useCanDeleteIblockType();
	const canCreate = canCreateIblockType();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание типа
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типа
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Тип инфоблока"
			queryKey={['iblock', 'type']}
			listQueryKey={['iblock', 'types']}
			invalidateQueryKeys={[['iblock']]}
			load={iblockTypeApi.get}
			save={iblockTypeApi.update}
			create={iblockTypeApi.create}
			remove={iblockTypeApi.remove}
			initialData={initialData}
			validate={validateIblockTypeForm}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<Stack gap="sm">
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
					<NumberInput
						label="Родитель (ID)"
						value={data.parent_id ?? undefined}
						readOnly={readOnly}
						onChange={(value) =>
							setField('parent_id', typeof value === 'number' ? value : null)
						}
						allowDecimal={false}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
