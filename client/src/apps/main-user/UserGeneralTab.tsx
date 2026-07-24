import { Flex, Form, Input, Switch } from 'antd';

import type { UserDetail } from '@/core/api/endpoints/mainApi';
import { DateTimeField } from '@/core/dates';
import { OuSelect } from '@/features/main/OuSelect';
import { UserSelect, tutorOuUserFilters } from '@/features/main/UserSelect';

interface UserGeneralTabProps {
	data: UserDetail;
	errors: Partial<Record<keyof UserDetail & string, string>>;
	readOnly: boolean;
	setField: <K extends keyof UserDetail>(key: K, value: UserDetail[K]) => void;
}

export function UserGeneralTab({ data, errors, readOnly, setField }: UserGeneralTabProps) {
	return (
		<Flex vertical gap={12}>
			<OuSelect
				value={data.ou_id ?? null}
				disabled={readOnly}
				onChange={(ouId) => setField('ou_id', ouId)}
			/>
			<UserSelect
				label="Руководитель"
				value={data.parent_id ?? null}
				filters={tutorOuUserFilters}
				disabled={readOnly}
				onChange={(userId) => setField('parent_id', userId)}
			/>
			<Form.Item
				label="Логин"
				required
				validateStatus={errors.login ? 'error' : undefined}
				help={errors.login}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.login ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('login', e.target.value)}
				/>
			</Form.Item>
			<Form.Item
				label="Псевдоним"
				required
				validateStatus={errors.alias ? 'error' : undefined}
				help={errors.alias}
				style={{ marginBottom: 0 }}
			>
				<Input
					value={data.alias ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('alias', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Email" style={{ marginBottom: 0 }}>
				<Input
					value={data.email ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('email', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Фамилия" style={{ marginBottom: 0 }}>
				<Input
					value={data.second_name ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('second_name', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Имя" style={{ marginBottom: 0 }}>
				<Input
					value={data.first_name ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('first_name', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Отчество" style={{ marginBottom: 0 }}>
				<Input
					value={data.patronymic ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('patronymic', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Телефон" style={{ marginBottom: 0 }}>
				<Input
					value={data.phone ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('phone', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Описание" style={{ marginBottom: 0 }}>
				<Input.TextArea
					value={data.description ?? ''}
					readOnly={readOnly}
					rows={3}
					autoSize={{ minRows: 3 }}
					onChange={(e) => setField('description', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Активен" style={{ marginBottom: 0 }}>
				<Switch
					checked={Boolean(data.active)}
					disabled={readOnly}
					onChange={(checked) => setField('active', checked)}
				/>
			</Form.Item>
			<DateTimeField
				label="Активен с"
				value={data.activeFrom as string | null | undefined}
				readOnly={readOnly}
				onChange={(value) => setField('activeFrom', value)}
			/>
			<DateTimeField
				label="Активен по"
				value={data.activeTo as string | null | undefined}
				readOnly={readOnly}
				onChange={(value) => setField('activeTo', value)}
			/>
		</Flex>
	);
}
