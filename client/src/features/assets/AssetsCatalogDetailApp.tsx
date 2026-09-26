import { Alert, NumberInput, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { assetsPartyApi } from '@/core/api/endpoints/assetsApi';
import { queryKeys } from '@/core/api/queryKeys';
import { MainEntityForm } from '@/features/main/MainEntityForm';

import type { AssetsCatalogConfig, AssetsField } from './assetsConfigs';
import { useEntityId } from './assetsAppUtils';

function validateAssetsForm(
	data: Record<string, unknown>,
	fields: AssetsField[],
): Partial<Record<string, string>> {
	const errors: Partial<Record<string, string>> = {};
	for (const field of fields) {
		if (!field.required) continue;
		const value = data[field.key];
		if (value == null || String(value).trim() === '') {
			errors[field.key] = 'Обязательное поле';
		}
	}
	return errors;
}

export function AssetsCatalogDetailApp({
	config,
}: {
	config: AssetsCatalogConfig;
}) {
	const entityId = useEntityId();
	const canRead = config.access.useCanRead();
	const canUpdate = config.access.useCanUpdate();
	const canDelete = config.access.useCanDelete();
	const canCreate = config.access.canCreate();
	const isNew = entityId === 0;
	const canSave = isNew ? canCreate : canUpdate;

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр
			</Alert>
		);
	}

	return (
		<MainEntityForm
			title={config.detailTitle}
			queryKey={config.detailQueryKey}
			listQueryKey={config.detailQueryKey}
			invalidateQueryKeys={[['assets']]}
			load={config.api.get}
			save={config.api.update}
			create={config.api.create}
			remove={config.api.remove}
			initialData={config.initialData}
			validate={(data) => validateAssetsForm(data, config.fields)}
			canSave={canSave}
			canDelete={canDelete}
		>
			{({ data, setField, errors, readOnly }) => (
				<AssetsFormFields
					fields={config.fields}
					data={data}
					setField={setField}
					errors={errors}
					readOnly={readOnly}
				/>
			)}
		</MainEntityForm>
	);
}

function AssetsFormFields({
	fields,
	data,
	setField,
	errors,
	readOnly,
}: {
	fields: AssetsField[];
	data: Record<string, unknown>;
	setField: <K extends string>(key: K, value: unknown) => void;
	errors: Partial<Record<string, string>>;
	readOnly: boolean;
}) {
	const needsParty = fields.some((f) => f.type === 'select-remote' && f.remote === 'party');
	const partiesQuery = useQuery({
		queryKey: queryKeys.assets.parties({ limit: -1, offset: 1 }),
		queryFn: () => assetsPartyApi.list({ limit: -1, offset: 1 }),
		enabled: needsParty,
	});

	const partyOptions = useMemo(() => {
		const items = partiesQuery.data?.items ?? [];
		return items.map((item) => ({
			value: String(item.id),
			label: item.name || `#${item.id}`,
		}));
	}, [partiesQuery.data?.items]);

	return (
		<Stack gap="sm">
			{fields.map((field) => {
				if (field.type === 'textarea') {
					return (
						<Textarea
							key={field.key}
							label={field.label}
							withAsterisk={field.required}
							value={String(data[field.key] ?? '')}
							error={errors[field.key]}
							readOnly={readOnly}
							minRows={3}
							onChange={(e) => setField(field.key, e.currentTarget.value)}
						/>
					);
				}
				if (field.type === 'number') {
					const raw = data[field.key];
					const num =
						raw == null || raw === ''
							? ''
							: typeof raw === 'number'
								? raw
								: Number(raw);
					return (
						<NumberInput
							key={field.key}
							label={field.label}
							withAsterisk={field.required}
							value={num === '' || Number.isNaN(num as number) ? '' : (num as number)}
							error={errors[field.key]}
							readOnly={readOnly}
							onChange={(next) =>
								setField(field.key, typeof next === 'number' ? next : null)
							}
						/>
					);
				}
				if (field.type === 'select-remote' && field.remote === 'party') {
					const value = data[field.key];
					return (
						<Select
							key={field.key}
							label={field.label}
							withAsterisk={field.required}
							data={partyOptions}
							value={value == null || value === '' ? null : String(value)}
							error={errors[field.key]}
							disabled={readOnly}
							searchable
							clearable
							onChange={(next) =>
								setField(field.key, next == null ? null : Number(next))
							}
						/>
					);
				}
				return (
					<TextInput
						key={field.key}
						label={field.label}
						withAsterisk={field.required}
						value={String(data[field.key] ?? '')}
						error={errors[field.key]}
						readOnly={readOnly}
						onChange={(e) => setField(field.key, e.currentTarget.value)}
					/>
				);
			})}
		</Stack>
	);
}
