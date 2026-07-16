import { NumberInput, Stack, Switch, TextInput } from '@mantine/core';

import { mainGroupApi, type GroupDetail } from '@/core/api/endpoints/mainApi';
import { MainEntityForm } from '@/features/main/MainEntityForm';

const initialData: GroupDetail = {
	id: 0,
	code: '',
	name: '',
	sort: 0,
	description: '',
	active: true,
};

export default function MainGroupApp() {
	return (
		<MainEntityForm
			title="Группа"
			queryKey={['main', 'group']}
			load={mainGroupApi.get}
			save={mainGroupApi.update}
			create={mainGroupApi.create}
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
						label="Активна"
						checked={Boolean(data.active)}
						onChange={(e) => setField('active', e.currentTarget.checked)}
					/>
				</Stack>
			)}
		</MainEntityForm>
	);
}
