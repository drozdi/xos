import {
	ActionIcon,
	Button,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
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
				value: String(item.value),
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
		<Stack gap="md">
			{!readOnly && typeId ? (
				<Group justify="flex-end">
					<Menu shadow="md" width={280} position="bottom-end">
						<Menu.Target>
							<Button
								size="xs"
								variant="light"
								leftSection={<IconPlus size={14} />}
								disabled={addOptions.length === 0}
								loading={catalogQuery.isLoading}
							>
								Добавить
							</Button>
						</Menu.Target>
						<Menu.Dropdown>
							{addOptions.length === 0 ? (
								<Menu.Label>Нет доступных свойств</Menu.Label>
							) : (
								addOptions.map((option) => (
									<Menu.Item
										key={option.value}
										onClick={() => void addProperty(Number(option.value))}
									>
										{option.label}
									</Menu.Item>
								))
							)}
						</Menu.Dropdown>
					</Menu>
				</Group>
			) : null}

			{sortedEntries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет свойств
				</Text>
			) : (
				sortedEntries.map(([key, item]) => {
					const component = isComponentProperty(item);
					const nestedProperties = normalizeSubDevicePropertiesRecord(
						item.properties,
					) as Record<string, SubDevicePropertyValue>;

					return (
						<Paper key={key} withBorder p="sm">
							<Group justify="space-between" align="flex-start" mb="sm">
								<Text fw={500} size="sm">
									{propertyTitle(item)}
								</Text>
								{!readOnly ? (
									<ActionIcon
										color="red"
										variant="light"
										aria-label={`Удалить ${propertyTitle(item)}`}
										onClick={() => removeRecord(key)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								) : null}
							</Group>

							{component ? (
								<Stack gap="sm">
									<TextInput
										label="Название"
										value={String(item.value ?? '')}
										readOnly={readOnly}
										onChange={(e) => updateRecord(key, { value: e.currentTarget.value })}
									/>
									<TextInput
										label="Серийный номер"
										value={String(item.sn ?? '')}
										readOnly={readOnly}
										onChange={(e) => updateRecord(key, { sn: e.currentTarget.value })}
									/>
									{Object.keys(nestedProperties).length > 0 ? (
										<SubDevicePropertiesEditor
											properties={nestedProperties}
											readOnly={readOnly}
											onChange={(next) => updateRecord(key, { properties: next })}
										/>
									) : null}
								</Stack>
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
						</Paper>
					);
				})
			)}
		</Stack>
	);
}
