import { Alert, Flex, Form, Input, InputNumber, Switch, Typography } from 'antd';

import { mainOuApi, type OuDetail } from '@/core/api/endpoints/mainApi';
import { canCreateMainOu, useCanDeleteMainOu, useCanReadMainOu, useCanUpdateMainOu } from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';
import { UserSelect, tutorOuUserFilters } from '@/features/main/UserSelect';

import { validateOuForm } from './mainOuValidation';

const initialData: OuDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	is_tutors: false,
	user_id: null,
};

export default function MainOuApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainOu();
	const canUpdate = useCanUpdateMainOu();
	const canDelete = useCanDeleteMainOu();
	const canSave = entityId === 0 ? canCreateMainOu() : canUpdate;

	if (entityId === 0 && !canCreateMainOu()) {
		return (
			<Alert
				type="error"
				showIcon
				message="Доступ запрещён"
				description="Нет прав на создание подразделения"
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
				description="Нет прав на просмотр подразделения"
				style={{ margin: 16 }}
			/>
		);
	}

	return (
		<MainEntityForm
			title="Подразделение"
			queryKey={['main', 'ou']}
			listQueryKey={['main', 'ous']}
			load={mainOuApi.get}
			save={mainOuApi.update}
			create={mainOuApi.create}
			remove={mainOuApi.remove}
			initialData={initialData}
			validate={validateOuForm}
			canSave={canSave}
			canDelete={canDelete}
			headerNote={({ data, isNew }) =>
				!isNew && data.x_timestamp ? (
					<Typography.Text type="secondary" style={{ fontSize: 13 }}>
						Последнее обновление: {String(data.x_timestamp)}
					</Typography.Text>
				) : null
			}
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
					<Form.Item label="Сортировка" style={{ marginBottom: 0 }}>
						<InputNumber
							value={data.sort ?? 0}
							disabled={readOnly}
							style={{ width: '100%' }}
							onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
						/>
					</Form.Item>
					<Form.Item label="Описание" style={{ marginBottom: 0 }}>
						<Input
							value={data.description ?? ''}
							readOnly={readOnly}
							onChange={(e) => setField('description', e.target.value)}
						/>
					</Form.Item>
					<Form.Item label="Руководители" style={{ marginBottom: 0 }}>
						<Switch
							checked={Boolean(data.is_tutors)}
							disabled={readOnly}
							onChange={(checked) => setField('is_tutors', checked)}
						/>
					</Form.Item>
					<UserSelect
						withAsterisk
						value={data.user_id ?? null}
						error={errors.user_id}
						filters={tutorOuUserFilters}
						disabled={readOnly}
						onChange={(userId) => setField('user_id', userId)}
					/>
				</Flex>
			)}
		</MainEntityForm>
	);
}
