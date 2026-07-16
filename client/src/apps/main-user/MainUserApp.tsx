import { Stack, Switch, TextInput } from '@mantine/core';

import { mainUserApi, type UserDetail } from '@/core/api/endpoints/mainApi';
import { MainEntityForm } from '@/features/main/MainEntityForm';

const initialData: UserDetail = {
	id: 0,
	login: '',
	alias: '',
	email: '',
	first_name: '',
	second_name: '',
	patronymic: '',
	phone: '',
	description: '',
	active: true,
};

export default function MainUserApp() {
	return (
		<MainEntityForm
			title="Пользователь"
			queryKey={['main', 'user']}
			load={mainUserApi.get}
			save={mainUserApi.update}
			create={mainUserApi.create}
			initialData={initialData}
		>
			{({ data, setField }) => (
				<Stack gap="sm">
					<TextInput
						label="Логин"
						value={data.login ?? ''}
						onChange={(e) => setField('login', e.currentTarget.value)}
					/>
					<TextInput
						label="Псевдоним"
						value={data.alias ?? ''}
						onChange={(e) => setField('alias', e.currentTarget.value)}
					/>
					<TextInput
						label="Email"
						value={data.email ?? ''}
						onChange={(e) => setField('email', e.currentTarget.value)}
					/>
					<TextInput
						label="Фамилия"
						value={data.second_name ?? ''}
						onChange={(e) => setField('second_name', e.currentTarget.value)}
					/>
					<TextInput
						label="Имя"
						value={data.first_name ?? ''}
						onChange={(e) => setField('first_name', e.currentTarget.value)}
					/>
					<TextInput
						label="Отчество"
						value={data.patronymic ?? ''}
						onChange={(e) => setField('patronymic', e.currentTarget.value)}
					/>
					<TextInput
						label="Телефон"
						value={data.phone ?? ''}
						onChange={(e) => setField('phone', e.currentTarget.value)}
					/>
					<TextInput
						label="Описание"
						value={data.description ?? ''}
						onChange={(e) => setField('description', e.currentTarget.value)}
					/>
					<Switch
						label="Активен"
						checked={Boolean(data.active)}
						onChange={(e) => setField('active', e.currentTarget.checked)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
