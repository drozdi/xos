import { Stack, TextInput } from '@mantine/core';

import { mainClaimantApi, type ClaimantDetail } from '@/core/api/endpoints/mainApi';
import { MainEntityForm } from '@/features/main/MainEntityForm';

const initialData: ClaimantDetail = {
	id: 0,
	code: '',
	name: '',
};

export default function MainClaimantApp() {
	return (
		<MainEntityForm
			title="Заявитель"
			queryKey={['main', 'claimant']}
			load={mainClaimantApi.get}
			save={mainClaimantApi.update}
			create={mainClaimantApi.create}
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
				</Stack>
			)}
		</MainEntityForm>
	);
}
