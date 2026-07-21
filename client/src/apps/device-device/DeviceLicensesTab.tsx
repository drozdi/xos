import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
	deviceLicenseKeyApi,
	deviceSoftwareApi,
	deviceSoftwareTypeApi,
} from '@/core/api/endpoints/deviceApi';
import { nextTempId, normalizeIdRecord } from '@/features/device/deviceAppUtils';

type LicenseRecord = Record<string, unknown>;

interface DeviceLicensesTabProps {
	licenses: unknown;
	readOnly: boolean;
	onChange: (licenses: Record<string, LicenseRecord>) => void;
}

const LICENSE_KIND_OPTIONS = [
	{ value: 'standard', label: 'Программа лицензии' },
	{ value: 'OEM', label: 'OEM' },
	{ value: 'RTL', label: 'RTL' },
];

function licenseKindLabel(item: LicenseRecord): string {
	if (item.licenseType === 'OEM' || item.licenseType === 'RTL') {
		return String(item.licenseType);
	}
	return String(item.licenseSoftware_name ?? '—');
}

function buildDisplayLabel(item: LicenseRecord): string {
	return [
		item.type_name,
		item.software_name,
		licenseKindLabel(item),
		item.key_name,
	]
		.filter(Boolean)
		.join(' · ');
}

export function DeviceLicensesTab({ licenses, readOnly, onChange }: DeviceLicensesTabProps) {
	const records = normalizeIdRecord(licenses);
	const entries = Object.entries(records);

	const [typeId, setTypeId] = useState<string | null>(null);
	const [softwareId, setSoftwareId] = useState<string | null>(null);
	const [licenseKind, setLicenseKind] = useState<string | null>(null);
	const [licenseSoftwareId, setLicenseSoftwareId] = useState<string | null>(null);
	const [keyValue, setKeyValue] = useState<string | null>(null);
	const [oemRtlKey, setOemRtlKey] = useState('');

	const typesQuery = useQuery({
		queryKey: ['device', 'softwareTypes', 'device-licenses'],
		queryFn: () => deviceSoftwareTypeApi.list({ limit: -1, offset: 1 }),
	});

	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'device-licenses'],
		queryFn: () =>
			deviceSoftwareApi.list({
				limit: -1,
				offset: 1,
				filters: { parent: null },
			}),
	});

	const licenseSoftwareQuery = useQuery({
		queryKey: ['device', 'licenseSoftware', 'device-licenses', softwareId],
		queryFn: () =>
			deviceLicenseKeyApi.list({
				t: 'select',
				limit: -1,
				offset: 1,
				filters: { software: Number(softwareId) },
			}),
		enabled: licenseKind === 'standard' && Boolean(softwareId),
	});

	const licenseSoftwareDetailQuery = useQuery({
		queryKey: ['device', 'licenseSoftwareDetail', licenseSoftwareId],
		queryFn: () => deviceLicenseKeyApi.get(Number(licenseSoftwareId)),
		enabled: licenseKind === 'standard' && Boolean(licenseSoftwareId),
	});

	const typeOptions = useMemo(
		() =>
			(typesQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[typesQuery.data?.items],
	);

	const softwareByType = useMemo(() => {
		const map = new Map<string, Array<{ value: string; label: string }>>();
		for (const item of softwareQuery.data?.items ?? []) {
			if (item.type_id == null) {
				continue;
			}
			const typeKey = String(item.type_id);
			const options = map.get(typeKey) ?? [];
			options.push({
				value: String(item.id),
				label: item.name || String(item.id),
			});
			map.set(typeKey, options);
		}
		return map;
	}, [softwareQuery.data?.items]);

	const softwareOptions = typeId ? (softwareByType.get(typeId) ?? []) : [];

	const licenseSoftwareOptions = useMemo(
		() =>
			(licenseSoftwareQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.name || String(item.id),
			})),
		[licenseSoftwareQuery.data?.items],
	);

	const keyOptions = useMemo(() => {
		const keys = licenseSoftwareDetailQuery.data?.keys ?? {};
		return Object.values(normalizeIdRecord(keys)).map((item) => ({
			value: String(item.id),
			label: String(item.value ?? item.id),
		}));
	}, [licenseSoftwareDetailQuery.data?.keys]);

	const resetAddForm = () => {
		setTypeId(null);
		setSoftwareId(null);
		setLicenseKind(null);
		setLicenseSoftwareId(null);
		setKeyValue(null);
		setOemRtlKey('');
	};

	const removeItem = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addLicense = () => {
		if (!typeId || !softwareId || !licenseKind) {
			return;
		}

		const typeLabel = typeOptions.find((item) => item.value === typeId)?.label ?? '';
		const softwareLabel =
			softwareOptions.find((item) => item.value === softwareId)?.label ?? '';

		const tempKey = nextTempId('lic');
		let payload: LicenseRecord;

		if (licenseKind === 'standard') {
			if (!licenseSoftwareId || !keyValue) {
				return;
			}
			const licenseSoftwareLabel =
				licenseSoftwareOptions.find((item) => item.value === licenseSoftwareId)?.label ?? '';
			const keyLabel = keyOptions.find((item) => item.value === keyValue)?.label ?? '';
			payload = {
				id: 0,
				type: Number(typeId),
				type_name: typeLabel,
				software: Number(softwareId),
				software_name: softwareLabel,
				licenseSoftware: Number(licenseSoftwareId),
				licenseSoftware_name: licenseSoftwareLabel,
				key: Number(keyValue),
				key_name: keyLabel,
			};
		} else {
			if (!oemRtlKey.trim()) {
				return;
			}
			payload = {
				id: 0,
				licenseType: licenseKind,
				type: Number(typeId),
				type_name: typeLabel,
				software: Number(softwareId),
				software_name: softwareLabel,
				key: oemRtlKey.trim(),
				key_name: oemRtlKey.trim(),
				licenseSoftware_name: licenseKind,
			};
		}

		onChange({ ...records, [tempKey]: payload });
		resetAddForm();
	};

	const canAdd =
		Boolean(typeId && softwareId && licenseKind) &&
		(licenseKind === 'standard'
			? Boolean(licenseSoftwareId && keyValue)
			: Boolean(oemRtlKey.trim()));

	return (
		<Stack gap="md">
			<Stack gap="xs">
				<Text fw={500} size="sm">
					Лицензии
				</Text>
				{entries.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет лицензий
					</Text>
				) : (
					<Table highlightOnHover withTableBorder withColumnBorders>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Тип программы</Table.Th>
								<Table.Th>Программа</Table.Th>
								<Table.Th>Лицензия</Table.Th>
								<Table.Th>Ключ</Table.Th>
								{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{entries.map(([key, item]) => (
								<Table.Tr key={key}>
									<Table.Td>{String(item.type_name ?? '—')}</Table.Td>
									<Table.Td>{String(item.software_name ?? '—')}</Table.Td>
									<Table.Td>{licenseKindLabel(item)}</Table.Td>
									<Table.Td>{String(item.key_name ?? '—')}</Table.Td>
									{!readOnly ? (
										<Table.Td>
											<ActionIcon
												color="red"
												variant="light"
												aria-label={`Удалить ${buildDisplayLabel(item)}`}
												onClick={() => removeItem(key)}
											>
												<IconTrash size={16} />
											</ActionIcon>
										</Table.Td>
									) : null}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				)}
			</Stack>

			{!readOnly ? (
				<Paper withBorder p="sm">
					<Stack gap="sm">
						<Text fw={500} size="sm">
							Добавить лицензию
						</Text>
						<Select
							label="Тип программы"
							data={typeOptions}
							value={typeId}
							searchable
							onChange={(value) => {
								setTypeId(value);
								setSoftwareId(null);
								setLicenseSoftwareId(null);
								setKeyValue(null);
							}}
						/>
						<Select
							label="Программа"
							data={softwareOptions}
							value={softwareId}
							searchable
							disabled={!typeId}
							onChange={(value) => {
								setSoftwareId(value);
								setLicenseSoftwareId(null);
								setKeyValue(null);
							}}
						/>
						<Select
							label="Вид лицензии"
							data={LICENSE_KIND_OPTIONS}
							value={licenseKind}
							disabled={!softwareId}
							onChange={(value) => {
								setLicenseKind(value);
								setLicenseSoftwareId(null);
								setKeyValue(null);
								setOemRtlKey('');
							}}
						/>
						{licenseKind === 'standard' ? (
							<>
								<Select
									label="Лицензия"
									data={licenseSoftwareOptions}
									value={licenseSoftwareId}
									searchable
									disabled={!softwareId}
									onChange={(value) => {
										setLicenseSoftwareId(value);
										setKeyValue(null);
									}}
								/>
								<Select
									label="Ключ"
									data={keyOptions}
									value={keyValue}
									searchable
									disabled={!licenseSoftwareId}
									onChange={setKeyValue}
								/>
							</>
						) : null}
						{licenseKind === 'OEM' || licenseKind === 'RTL' ? (
							<TextInput
								label="Ключ"
								value={oemRtlKey}
								onChange={(e) => setOemRtlKey(e.currentTarget.value)}
							/>
						) : null}
						<Group justify="flex-end">
							<Button
								size="xs"
								variant="light"
								leftSection={<IconPlus size={14} />}
								disabled={!canAdd}
								onClick={addLicense}
							>
								Добавить
							</Button>
						</Group>
					</Stack>
				</Paper>
			) : null}
		</Stack>
	);
}
