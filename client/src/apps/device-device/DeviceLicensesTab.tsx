import {
	Button,
	Card,
	Flex,
	Form,
	Input,
	Select,
	Table,
	Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
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
		<Flex vertical gap={16}>
			<Flex vertical gap={8}>
				<Typography.Text strong style={{ fontSize: 14 }}>
					Лицензии
				</Typography.Text>
				{entries.length === 0 ? (
					<Typography.Text type="secondary">Нет лицензий</Typography.Text>
				) : (
					<Table
						size="small"
						bordered
						pagination={false}
						rowKey={([key]) => key}
						dataSource={entries}
						columns={[
							{
								title: 'Тип программы',
								key: 'type',
								render: (_: unknown, [, item]: [string, LicenseRecord]) =>
									String(item.type_name ?? '—'),
							},
							{
								title: 'Программа',
								key: 'software',
								render: (_: unknown, [, item]: [string, LicenseRecord]) =>
									String(item.software_name ?? '—'),
							},
							{
								title: 'Лицензия',
								key: 'license',
								render: (_: unknown, [, item]: [string, LicenseRecord]) => licenseKindLabel(item),
							},
							{
								title: 'Ключ',
								key: 'key',
								render: (_: unknown, [, item]: [string, LicenseRecord]) =>
									String(item.key_name ?? '—'),
							},
							...(!readOnly
								? [
										{
											title: '',
											key: 'actions',
											width: 48,
											render: (_: unknown, [key, item]: [string, LicenseRecord]) => (
												<Button
													type="text"
													danger
													aria-label={`Удалить ${buildDisplayLabel(item)}`}
													icon={<DeleteOutlined style={{ fontSize: 16 }} />}
													onClick={() => removeItem(key)}
												/>
											),
										},
									]
								: []),
						]}
					/>
				)}
			</Flex>

			{!readOnly ? (
				<Card size="small">
					<Flex vertical gap={12}>
						<Typography.Text strong style={{ fontSize: 14 }}>
							Добавить лицензию
						</Typography.Text>
						<Form.Item label="Тип программы" style={{ marginBottom: 0 }}>
							<Select
								options={typeOptions}
								value={typeId}
								showSearch
								onChange={(value) => {
									setTypeId(value);
									setSoftwareId(null);
									setLicenseSoftwareId(null);
									setKeyValue(null);
								}}
							/>
						</Form.Item>
						<Form.Item label="Программа" style={{ marginBottom: 0 }}>
							<Select
								options={softwareOptions}
								value={softwareId}
								showSearch
								disabled={!typeId}
								onChange={(value) => {
									setSoftwareId(value);
									setLicenseSoftwareId(null);
									setKeyValue(null);
								}}
							/>
						</Form.Item>
						<Form.Item label="Вид лицензии" style={{ marginBottom: 0 }}>
							<Select
								options={LICENSE_KIND_OPTIONS}
								value={licenseKind}
								disabled={!softwareId}
								onChange={(value) => {
									setLicenseKind(value);
									setLicenseSoftwareId(null);
									setKeyValue(null);
									setOemRtlKey('');
								}}
							/>
						</Form.Item>
						{licenseKind === 'standard' ? (
							<>
								<Form.Item label="Лицензия" style={{ marginBottom: 0 }}>
									<Select
										options={licenseSoftwareOptions}
										value={licenseSoftwareId}
										showSearch
										disabled={!softwareId}
										onChange={(value) => {
											setLicenseSoftwareId(value);
											setKeyValue(null);
										}}
									/>
								</Form.Item>
								<Form.Item label="Ключ" style={{ marginBottom: 0 }}>
									<Select
										options={keyOptions}
										value={keyValue}
										showSearch
										disabled={!licenseSoftwareId}
										onChange={setKeyValue}
									/>
								</Form.Item>
							</>
						) : null}
						{licenseKind === 'OEM' || licenseKind === 'RTL' ? (
							<Form.Item label="Ключ" style={{ marginBottom: 0 }}>
								<Input value={oemRtlKey} onChange={(e) => setOemRtlKey(e.target.value)} />
							</Form.Item>
						) : null}
						<Flex justify="flex-end">
							<Button
								size="small"
								icon={<PlusOutlined style={{ fontSize: 14 }} />}
								disabled={!canAdd}
								onClick={addLicense}
							>
								Добавить
							</Button>
						</Flex>
					</Flex>
				</Card>
			) : null}
		</Flex>
	);
}
