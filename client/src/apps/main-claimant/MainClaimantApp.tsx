import { Alert, Flex, Form, Input } from 'antd';

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
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание заявителя"
				style={{ margin: 16 }}
			/>
		);
	}

	if (entityId !== 0 && !canRead) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на просмотр заявителя"
				style={{ margin: 16 }}
			/>
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
				<Flex vertical gap={12}>
					<Form.Item
						label="Код"
						required
						validateStatus={errors.code ? 'error' : undefined}
						help={errors.code}
						style={{ marginBottom: 0 }}
					>
						<Input
							value={data.code ?? ''}
							readOnly={readOnly}
							onChange={(e) => setField('code', e.target.value)}
						/>
					</Form.Item>
					<Form.Item
						label="Название"
						required
						validateStatus={errors.name ? 'error' : undefined}
						help={errors.name}
						style={{ marginBottom: 0 }}
					>
						<Input
							value={data.name ?? ''}
							readOnly={readOnly}
							onChange={(e) => setField('name', e.target.value)}
						/>
					</Form.Item>
				</Flex>
			)}
		</MainEntityForm>
	);
}
