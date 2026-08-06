import { Alert, Badge, Group, Stack, Text, TextInput } from '@mantine/core';
import { useMemo } from 'react';

import { mainClaimantApi, type ClaimantDetail } from '@/core/api/endpoints/mainApi';
import { useCanReadMainClaimant } from '@/features/main/mainAccess';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import { useEntityId } from '@/features/main/mainAppUtils';

const initialData: ClaimantDetail = {
	id: 0,
	code: '',
	name: '',
	access_options: {},
};

export default function MainClaimantApp() {
	const entityId = useEntityId();
	const canRead = useCanReadMainClaimant();

	if (entityId === 0) {
		return (
			<Alert color="red" title="Только просмотр" m="md">
				Создание доступных прав отключено. Каталог заполняется из setting.json через sync.
			</Alert>
		);
	}

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр доступного права
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title="Доступное право"
			queryKey={['main', 'claimant']}
			listQueryKey={['main', 'claimants']}
			load={mainClaimantApi.get}
			save={async () => entityId}
			create={async () => 0}
			initialData={initialData}
			canSave={false}
			canDelete={false}
		>
			{({ data }) => <ClaimantView data={data} />}
		</MainEntityForm>
	);
}

function ClaimantView({ data }: { data: ClaimantDetail }) {
	const options = useMemo(() => {
		const raw = data.access_options;
		if (!raw || Array.isArray(raw)) {
			return [];
		}
		return Object.entries(raw)
			.map(([key, opt]) => ({
				key,
				title: opt.title || key,
				bit: opt.bit,
			}))
			.sort((a, b) => a.bit - b.bit || a.key.localeCompare(b.key));
	}, [data.access_options]);

	return (
		<Stack gap="sm">
			<TextInput label="Код" value={data.code ?? ''} readOnly />
			<TextInput label="Название" value={data.name ?? ''} readOnly />
			<div>
				<Text size="sm" fw={500} mb={6}>
					Правила доступа
				</Text>
				{options.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет правил
					</Text>
				) : (
					<Stack gap={6}>
						{options.map((opt) => (
							<Group key={opt.key} gap="xs">
								<Badge variant="light">{opt.title}</Badge>
								<Text size="xs" c="dimmed" ff="monospace">
									{opt.key} = {opt.bit}
								</Text>
							</Group>
						))}
					</Stack>
				)}
			</div>
		</Stack>
	);
}
