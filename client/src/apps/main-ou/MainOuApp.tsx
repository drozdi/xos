import { NumberInput, Stack, Switch, TextInput } from '@mantine/core';

import { mainOuApi, type OuDetail } from '@/core/api/endpoints/mainApi';
import { MainEntityForm } from '@/features/main/MainEntityForm';

const initialData: OuDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	is_tutors: false,
};

export default function MainOuApp() {
	return (
		<MainEntityForm
			title="Подразделение"
			queryKey={['main', 'ou']}
			load={mainOuApi.get}
			save={mainOuApi.update}
			create={mainOuApi.create}
			initialData={initialData}
		>
			{({ data, setField }) => (
				<Stack gap="sm">
					<TextInput
						label="Код"
						value={data.code ?? ''}
						onChange={(e) => setField('code', e.currentTarget.value)}
					/>
					<TextInput
						label="Название"
						value={data.name ?? ''}
						onChange={(e) => setField('name', e.currentTarget.value)}
					/>
					<NumberInput
						label="Сортировка"
						value={data.sort ?? 0}
						onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
					/>
					<TextInput
						label="Описание"
						value={data.description ?? ''}
						onChange={(e) => setField('description', e.currentTarget.value)}
					/>
					<Switch
						label="Руководители"
						checked={Boolean(data.is_tutors)}
						onChange={(e) => setField('is_tutors', e.currentTarget.checked)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
