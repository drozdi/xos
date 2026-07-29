import {
	PasswordInput,
	Stack,
	Switch,
	TextInput,
	Textarea,
} from '@mantine/core';

import type { UserDetail } from '@/core/api/endpoints/mainApi';
import { DateTimeField } from '@/core/dates';
import { OuSelect } from '@/features/main/OuSelect';
import { UserSelect, tutorOuUserFilters } from '@/features/main/UserSelect';

interface UserGeneralTabProps {
	data: UserDetail;
	errors: Partial<Record<keyof UserDetail & string, string>>;
	readOnly: boolean;
	canChangePassword?: boolean;
	setField: <K extends keyof UserDetail>(key: K, value: UserDetail[K]) => void;
}

export function UserGeneralTab({
	data,
	errors,
	readOnly,
	canChangePassword = false,
	setField,
}: UserGeneralTabProps) {
	return (
		<Stack gap="sm">
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
			<TextInput
				label="Логин"
				withAsterisk
				value={data.login ?? ''}
				error={errors.login}
				readOnly={readOnly}
				onChange={(e) => setField('login', e.currentTarget.value)}
			/>
			<TextInput
				label="Псевдоним"
				withAsterisk
				value={data.alias ?? ''}
				error={errors.alias}
				readOnly={readOnly}
				onChange={(e) => setField('alias', e.currentTarget.value)}
			/>
			<TextInput
				label="Email"
				value={data.email ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('email', e.currentTarget.value)}
			/>
			{canChangePassword ? (
				<>
					<PasswordInput
						label="Пароль"
						value={typeof data.password === 'string' ? data.password : ''}
						error={errors.password}
						onChange={(e) => setField('password', e.currentTarget.value)}
						autoComplete="new-password"
					/>
					<PasswordInput
						label="Подтверждение пароля"
						value={
							typeof data.confirm_password === 'string'
								? data.confirm_password
								: ''
						}
						error={errors.confirm_password ?? errors.password}
						onChange={(e) =>
							setField('confirm_password', e.currentTarget.value)
						}
						autoComplete="new-password"
					/>
				</>
			) : null}
			<TextInput
				label="Фамилия"
				value={data.second_name ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('second_name', e.currentTarget.value)}
			/>
			<TextInput
				label="Имя"
				value={data.first_name ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('first_name', e.currentTarget.value)}
			/>
			<TextInput
				label="Отчество"
				value={data.patronymic ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('patronymic', e.currentTarget.value)}
			/>
			<TextInput
				label="Телефон"
				value={data.phone ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('phone', e.currentTarget.value)}
			/>
			<Textarea
				label="Описание"
				value={data.description ?? ''}
				readOnly={readOnly}
				minRows={3}
				autosize
				onChange={(e) => setField('description', e.currentTarget.value)}
			/>
			<Switch
				label="Активен"
				checked={Boolean(data.active)}
				disabled={readOnly}
				onChange={(e) => setField('active', e.currentTarget.checked)}
			/>
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
		</Stack>
	);
}
