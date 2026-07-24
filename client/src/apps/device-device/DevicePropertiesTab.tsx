import {
	Button,
	Card,
	Dropdown,
	Flex,
	Form,
	Input,
	Typography,
} from 'antd';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { deviceApi } from '@/core/api/endpoints/deviceApi';
import { SubDevicePropertiesEditor } from '@/features/device/SubDevicePropertiesEditor';
import { nextTempId, normalizeIdRecord } from '@/features/device/deviceAppUtils';
import {
	normalizeSubDevicePropertiesRecord,
	type SubDevicePropertyValue,
} from '@/features/device/subDevicePropertyUtils';

type PropertyRecord = Record<string, unknown>;

interface DevicePropertiesTabProps {
	typeId: number | null | undefined;
	properties: unknown;
	readOnly: boolean;
	onChange: (properties: Record<string, PropertyRecord>) => void;
}

function isComponentProperty(item: PropertyRecord): boolean {
	if (item.subDeviceId != null && Number(item.subDeviceId) > 0) {
		return true;
	}
	const nested = item.properties;
	return Boolean(nested && typeof nested === 'object' && Object.keys(nested as object).length > 0);
}

function propertyTitle(item: PropertyRecord): string {
	return String(item.name ?? item.code ?? 'Свойство');
}

export function DevicePropertiesTab({
	typeId,
	properties,
	readOnly,
	onChange,
}: DevicePropertiesTabProps) {
	const records = normalizeIdRecord(properties);

	const catalogQuery = useQuery({
		queryKey: ['device', 'deviceTypeProperties', typeId],
		queryFn: () => deviceApi.typeProperties(Number(typeId)),
		enabled: Boolean(typeId),
	});

	const addOptions = useMemo(
		() =>
			(catalogQuery.data ?? []).map((item) => ({
				key: String(item.value),
				label: item.sublabel ? `${item.label} (${item.sublabel})` : item.label,
			})),
		[catalogQuery.data],
	);

	const sortedEntries = useMemo(() => {
		const entries = Object.entries(records).map(([key, item]) => [key, item] as const);
		return entries.sort(
			([, a], [, b]) => (Number(a.sort) || 0) - (Number(b.sort) || 0),
		);
	}, [records]);

	const updateRecord = (key: string, patch: PropertyRecord) => {
		onChange({
			...records,
			[key]: {
				...records[key],
				...patch,
			},
		});
	};

	const removeRecord = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addProperty = async (propertyId: number) => {
		const template = await deviceApi.propertyTemplate(propertyId);
		const tempKey = nextTempId('prop');
		const nested = normalizeSubDevicePropertiesRecord(template.properties);
		const isComponent = Object.keys(nested).length > 0;

		onChange({
			...records,
			[tempKey]: {
				...template,
				id: 0,
				property_id: propertyId,
				value: isComponent ? '' : template.value ?? '',
				sn: '',
				properties: isComponent ? nested : undefined,
			},
		});
	};

	return (
		<Flex vertical gap={16}>
			{!readOnly && typeId ? (
				<Flex justify="flex-end">
					<Dropdown
						menu={{
							items:
								addOptions.length === 0
									? [{ key: 'empty', label: 'Нет доступных свойств', disabled: true }]
									: addOptions.map((option) => ({
											key: option.key,
											label: option.label,
											onClick: () => void addProperty(Number(option.key)),
										})),
						}}
						disabled={addOptions.length === 0}
					>
						<Button
							size="small"
							icon={<IconPlus size={14} />}
							disabled={addOptions.length === 0}
							loading={catalogQuery.isLoading}
						>
							Добавить
						</Button>
					</Dropdown>
				</Flex>
			) : null}

			{sortedEntries.length === 0 ? (
				<Typography.Text type="secondary">Нет свойств</Typography.Text>
			) : (
				sortedEntries.map(([key, item]) => {
					const component = isComponentProperty(item);
					const nestedProperties = normalizeSubDevicePropertiesRecord(
						item.properties,
					) as Record<string, SubDevicePropertyValue>;

					return (
						<Card key={key} size="small">
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
								<Typography.Text strong style={{ fontSize: 14 }}>
									{propertyTitle(item)}
								</Typography.Text>
								{!readOnly ? (
									<Button
										type="text"
										danger
										aria-label={`Удалить ${propertyTitle(item)}`}
										icon={<IconTrash size={16} />}
										onClick={() => removeRecord(key)}
									/>
								) : null}
							</Flex>

							{component ? (
								<Flex vertical gap={12}>
									<Form.Item label="Название" style={{ marginBottom: 0 }}>
										<Input
											value={String(item.value ?? '')}
											readOnly={readOnly}
											onChange={(e) => updateRecord(key, { value: e.target.value })}
										/>
									</Form.Item>
									<Form.Item label="Серийный номер" style={{ marginBottom: 0 }}>
										<Input
											value={String(item.sn ?? '')}
											readOnly={readOnly}
											onChange={(e) => updateRecord(key, { sn: e.target.value })}
										/>
									</Form.Item>
									{Object.keys(nestedProperties).length > 0 ? (
										<SubDevicePropertiesEditor
											properties={nestedProperties}
											readOnly={readOnly}
											onChange={(next) => updateRecord(key, { properties: next })}
										/>
									) : null}
								</Flex>
							) : (
								<SubDevicePropertiesEditor
									properties={{
										[key]: item as SubDevicePropertyValue,
									}}
									readOnly={readOnly}
									onChange={(next) => {
										const updated = next[key];
										if (updated) {
											updateRecord(key, updated);
										}
									}}
								/>
							)}
						</Card>
					);
				})
			)}
		</Flex>
	);
}
