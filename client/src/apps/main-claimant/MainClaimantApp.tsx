import { Alert, Stack, TextInput } from '@mantine/core';

import { mainClaimantApi, type ClaimantDetail } from '@/core/api/endpoints/mainApi';
import {
	canCreateMainClaimant,
	useCanDeleteMainClaimant,
	useCanReadMainClaimant,
	useCanUpdateMainClaimant,
} from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';

import { validateClaimantForm } from './mainClaimantValidation';

const initialData: ClaimantDetail = {
	id: 0,
	code: '',
	name: '',
};

export default function MainClaimantApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainClaimant();
	const canUpdate = useCanUpdateMainClaimant();
	const canDelete = useCanDeleteMainClaimant();
	const canSave = entityId === 0 ? canCreateMainClaimant() : canUpdate;

	if (entityId === 0 && !canCreateMainClaimant()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание заявителя
			</Alert>
		);
	}

	if (entityId !== 0 && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр заявителя
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Заявитель"
			queryKey={['main', 'claimant']}
			listQueryKey={['main', 'claimants']}
			load={mainClaimantApi.get}
			save={mainClaimantApi.update}
			create={mainClaimantApi.create}
			remove={mainClaimantApi.remove}
			initialData={initialData}
			validate={validateClaimantForm}
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
				</Stack>
			)}
		</MainEntityForm>
	);
}
