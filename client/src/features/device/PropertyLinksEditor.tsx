import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Modal,
	Select,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useQueries, useQuery } from '@tanstack/react-query';
import { IconExternalLink, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import { deviceComponentApi, deviceTypeApi } from '@/core/api/endpoints/deviceApi';
import { nextTempId, normalizeIdRecord } from '@/features/device/deviceAppUtils';
import type { TypePropertyItem } from '@/features/device/propertyTypes';

import type { PropertyLinkItem } from './propertyTypes';

interface PropertyLinksEditorProps {
	links: Record<string, PropertyLinkItem>;
	propertyName?: string;
	propertyCode?: string;
	readOnly: boolean;
	onChange: (links: Record<string, PropertyLinkItem>) => void;
	onOpenType?: (typeKind: PropertyLinkItem['type_kind'], typeId: number) => void;
}

type ModalMode = 'component' | 'device' | 'existing' | null;

function typeTitle(item: PropertyLinkItem): string {
	const kind = item.type_kind === 'component' ? 'Тип комплектующего' : 'Тип устройства';
	const name = item.type_name ?? `#${item.type_id}`;
	const code = item.type_code ? ` (${item.type_code})` : '';
	return `${kind}: ${name}${code}`;
}

function linkTitle(item: PropertyLinkItem): string {
	if (item.link_kind === 'root') {
		return `Корневое: ${item.property_name ?? item.property_code ?? '—'}`;
	}
	const propertyName = item.property_name ?? item.property_code ?? '—';
	if (item.parent_property_name) {
		return `${propertyName} → в «${item.parent_property_name}»`;
	}
	return propertyName;
}

function linkSignature(item: PropertyLinkItem): string {
	if (item.link_kind === 'root') {
		return `root:${item.type_id}`;
	}
	return `property:${item.type_id}:${item.parent_property_id ?? 0}`;
}

function createLinkItem(
	base: Omit<PropertyLinkItem, 'id'> & { id?: number },
	propertyName?: string,
	propertyCode?: string,
): PropertyLinkItem {
	return {
		id: 0,
		active: true,
		required: false,
		multiple: false,
		readonly: false,
		link_kind: 'property',
		property_name: propertyName ?? '',
		property_code: propertyCode ?? '',
		...base,
	};
}

export function PropertyLinksEditor({
	links,
	propertyName,
	propertyCode,
	readOnly,
	onChange,
	onOpenType,
}: PropertyLinksEditorProps) {
	const [modalMode, setModalMode] = useState<ModalMode>(null);
	const [selectedType, setSelectedType] = useState<string | null>(null);
	const [selectedExisting, setSelectedExisting] = useState<string | null>(null);

	const records = useMemo(() => normalizeIdRecord<PropertyLinkItem>(links), [links]);
	const entries = useMemo(
		() =>
			Object.entries(records).sort(([, a], [, b]) =>
				typeTitle(a).localeCompare(typeTitle(b), 'ru'),
			),
		[records],
	);
	const usedSignatures = useMemo(() => new Set(entries.map(([, item]) => linkSignature(item))), [entries]);

	const deviceTypesQuery = useQuery({
		queryKey: ['device', 'types', 'property-links'],
		queryFn: () =>
			deviceTypeApi.list({
				limit: -1,
				offset: 1,
				filters: { parent: null, property: null },
			}),
		enabled: modalMode === 'device',
	});

	const componentTypesQuery = useQuery({
		queryKey: ['device', 'components', 'property-links'],
		queryFn: () => deviceComponentApi.list({ limit: -1, offset: 1 }),
		enabled: modalMode === 'component',
	});

	const componentListQuery = useQuery({
		queryKey: ['device', 'components', 'property-link-targets'],
		queryFn: () => deviceComponentApi.list({ limit: -1, offset: 1 }),
		enabled: modalMode === 'existing',
	});

	const componentIds = useMemo(
		() => componentListQuery.data?.items.map((item) => item.id) ?? [],
		[componentListQuery.data?.items],
	);

	const componentDetailsQueries = useQueries({
		queries: componentIds.map((id) => ({
			queryKey: ['device', 'component', id, 'property-link-target'],
			queryFn: () => deviceComponentApi.get(id),
			enabled: modalMode === 'existing',
		})),
	});

	const componentTypeOptions = useMemo(() => {
		return (componentTypesQuery.data?.items ?? [])
			.filter((item) => !usedSignatures.has(`property:${item.id}:0`))
			.map((item) => ({
				value: String(item.id),
				label: `${item.name} (${item.code})`,
				name: item.name,
				code: item.code,
			}))
			.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
	}, [componentTypesQuery.data?.items, usedSignatures]);

	const deviceTypeOptions = useMemo(() => {
		return (deviceTypesQuery.data?.items ?? [])
			.filter((item) => !usedSignatures.has(`property:${item.id}:0`))
			.map((item) => ({
				value: String(item.id),
				label: `${item.name} (${item.code})`,
				name: item.name,
				code: item.code,
			}))
			.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
	}, [deviceTypesQuery.data?.items, usedSignatures]);

	const existingPropertyOptions = useMemo(() => {
		const options: Array<{
			value: string;
			label: string;
			type_id: number;
			type_name: string;
			parent_property_id: number;
			parent_property_name: string;
		}> = [];

		componentDetailsQueries.forEach((query, index) => {
			const typeId = componentIds[index];
			const typeItem = componentListQuery.data?.items.find((item) => item.id === typeId);
			if (!typeItem || !query.data?.properties) {
				return;
			}
			const properties = normalizeIdRecord<TypePropertyItem>(query.data.properties);
			for (const property of Object.values(properties)) {
				const parentId = property.id;
				if (!parentId) {
					continue;
				}
				const signature = `property:${typeId}:${parentId}`;
				if (usedSignatures.has(signature)) {
					continue;
				}
				const propertyLabel = property.name
					? property.code
						? `${property.name} (${property.code})`
						: property.name
					: `#${parentId}`;
				options.push({
					value: `${typeId}:${parentId}`,
					label: `${typeItem.name}: ${propertyLabel}`,
					type_id: typeId,
					type_name: typeItem.name,
					parent_property_id: parentId,
					parent_property_name: property.name ?? propertyLabel,
				});
			}
		});

		return options.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
	}, [componentDetailsQueries, componentIds, componentListQuery.data?.items, usedSignatures]);

	const closeModal = () => {
		setModalMode(null);
		setSelectedType(null);
		setSelectedExisting(null);
	};

	const updateLink = (key: string, patch: Partial<PropertyLinkItem>) => {
		const current = records[key];
		if (!current) {
			return;
		}
		onChange({
			...records,
			[key]: { ...current, ...patch },
		});
	};

	const removeLink = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addDirectTypeLink = (kind: 'component' | 'device') => {
		if (!selectedType) {
			return;
		}
		const typeId = Number(selectedType);
		const options = kind === 'component' ? componentTypeOptions : deviceTypeOptions;
		const option = options.find((item) => item.value === selectedType);
		if (!typeId || !option) {
			return;
		}
		const key = nextTempId('l');
		onChange({
			...records,
			[key]: createLinkItem(
				{
					type_id: typeId,
					type_kind: kind,
					type_name: option.name,
					type_code: option.code,
				},
				propertyName,
				propertyCode,
			),
		});
		closeModal();
	};

	const addExistingPropertyLink = () => {
		if (!selectedExisting) {
			return;
		}
		const [typeIdValue, parentPropertyIdValue] = selectedExisting.split(':');
		const typeId = Number(typeIdValue);
		const parentPropertyId = Number(parentPropertyIdValue);
		const option = existingPropertyOptions.find((item) => item.value === selectedExisting);
		if (!typeId || !parentPropertyId || !option) {
			return;
		}
		const key = nextTempId('l');
		onChange({
			...records,
			[key]: createLinkItem(
				{
					type_id: option.type_id,
					type_kind: 'component',
					type_name: option.type_name,
					parent_property_id: option.parent_property_id,
					parent_property_name: option.parent_property_name,
				},
				propertyName,
				propertyCode,
			),
		});
		closeModal();
	};

	return (
		<Stack gap="sm">
			{!readOnly ? (
				<Group gap="xs">
					<Button size="xs" variant="light" onClick={() => setModalMode('component')}>
						Присоединить к Типу комплектующему
					</Button>
					<Button size="xs" variant="light" onClick={() => setModalMode('device')}>
						Присоединить к Типу устройств
					</Button>
					<Button size="xs" variant="default" onClick={() => setModalMode('existing')}>
						Связать с существующими свойствами
					</Button>
				</Group>
			) : null}

			{entries.length === 0 ? (
				<Text size="sm" c="dimmed">
					Нет связанных типов
				</Text>
			) : (
				<Table highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Тип</Table.Th>
							<Table.Th>Связь</Table.Th>
							<Table.Th w={150}>Флаги</Table.Th>
							<Table.Th w={72} aria-label="Действия" />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map(([key, item]) => {
							const isReadonly = readOnly || Boolean(item.readonly);
							const flagsDisabled = isReadonly || item.link_kind === 'root';
							return (
								<Table.Tr key={key}>
									<Table.Td>
										<Text size="sm">{typeTitle(item)}</Text>
									</Table.Td>
									<Table.Td>
										<Text size="sm">{linkTitle(item)}</Text>
									</Table.Td>
									<Table.Td>
										<Stack gap={4}>
											<Checkbox
												size="xs"
												label="Активно"
												checked={Boolean(item.active)}
												disabled={flagsDisabled}
												onChange={(e) =>
													updateLink(key, { active: e.currentTarget.checked })
												}
											/>
											<Checkbox
												size="xs"
												label="Обязательное"
												checked={Boolean(item.required)}
												disabled={flagsDisabled}
												onChange={(e) =>
													updateLink(key, { required: e.currentTarget.checked })
												}
											/>
											<Checkbox
												size="xs"
												label="Множественное"
												checked={Boolean(item.multiple)}
												disabled={flagsDisabled}
												onChange={(e) =>
													updateLink(key, { multiple: e.currentTarget.checked })
												}
											/>
										</Stack>
									</Table.Td>
									<Table.Td>
										<Group gap={4} wrap="nowrap">
											{onOpenType ? (
												<ActionIcon
													variant="subtle"
													aria-label="Открыть тип"
													onClick={() => onOpenType(item.type_kind, item.type_id)}
												>
													<IconExternalLink size={16} />
												</ActionIcon>
											) : null}
											{!isReadonly ? (
												<ActionIcon
													color="red"
													variant="light"
													aria-label="Удалить связь"
													onClick={() => removeLink(key)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											) : null}
										</Group>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			)}

			<Modal
				opened={modalMode === 'component'}
				onClose={closeModal}
				title="Присоединить к Типу комплектующему"
				centered
			>
				<Stack gap="sm">
					<Select
						label="Тип комплектующего"
						placeholder="Выберите тип"
						data={componentTypeOptions}
						value={selectedType}
						onChange={setSelectedType}
						searchable
						nothingFoundMessage="Нет доступных типов"
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={closeModal}>
							Отмена
						</Button>
						<Button onClick={() => addDirectTypeLink('component')} disabled={!selectedType}>
							Присоединить
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Modal
				opened={modalMode === 'device'}
				onClose={closeModal}
				title="Присоединить к Типу устройств"
				centered
			>
				<Stack gap="sm">
					<Select
						label="Тип устройства"
						placeholder="Выберите тип"
						data={deviceTypeOptions}
						value={selectedType}
						onChange={setSelectedType}
						searchable
						nothingFoundMessage="Нет доступных типов"
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={closeModal}>
							Отмена
						</Button>
						<Button onClick={() => addDirectTypeLink('device')} disabled={!selectedType}>
							Присоединить
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Modal
				opened={modalMode === 'existing'}
				onClose={closeModal}
				title="Связать с существующими свойствами комплектующих"
				centered
				size="lg"
			>
				<Stack gap="sm">
					<Select
						label="Свойство типа комплектующего"
						placeholder="Выберите свойство"
						data={existingPropertyOptions}
						value={selectedExisting}
						onChange={setSelectedExisting}
						searchable
						nothingFoundMessage={
							componentListQuery.isLoading || componentDetailsQueries.some((q) => q.isLoading)
								? 'Загрузка...'
								: 'Нет доступных свойств'
						}
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={closeModal}>
							Отмена
						</Button>
						<Button onClick={addExistingPropertyLink} disabled={!selectedExisting}>
							Связать
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
