import {
	Button,
	Checkbox,
	Flex,
	Form,
	Modal,
	Select,
	Table,
	Typography,
} from 'antd';
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
	} as PropertyLinkItem;
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
			if (typeId == null) {
				return;
			}
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
		<Flex vertical gap={12}>
			{!readOnly ? (
				<Flex gap={8} wrap="wrap">
					<Button size="small" onClick={() => setModalMode('component')}>
						Присоединить к Типу комплектующему
					</Button>
					<Button size="small" onClick={() => setModalMode('device')}>
						Присоединить к Типу устройств
					</Button>
					<Button size="small" onClick={() => setModalMode('existing')}>
						Связать с существующими свойствами
					</Button>
				</Flex>
			) : null}

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет связанных типов</Typography.Text>
			) : (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey={([key]) => key}
					dataSource={entries}
					columns={[
						{
							title: 'Тип',
							key: 'type',
							render: (_: unknown, [, item]: [string, PropertyLinkItem]) => (
								<Typography.Text>{typeTitle(item)}</Typography.Text>
							),
						},
						{
							title: 'Связь',
							key: 'link',
							render: (_: unknown, [, item]: [string, PropertyLinkItem]) => (
								<Typography.Text>{linkTitle(item)}</Typography.Text>
							),
						},
						{
							title: 'Флаги',
							key: 'flags',
							width: 150,
							render: (_: unknown, [key, item]: [string, PropertyLinkItem]) => {
								const isReadonly = readOnly || Boolean(item.readonly);
								const flagsDisabled = isReadonly || item.link_kind === 'root';
								return (
									<Flex vertical gap={4}>
										<Checkbox
											checked={Boolean(item.active)}
											disabled={flagsDisabled}
											onChange={(e) => updateLink(key, { active: e.target.checked })}
										>
											Активно
										</Checkbox>
										<Checkbox
											checked={Boolean(item.required)}
											disabled={flagsDisabled}
											onChange={(e) => updateLink(key, { required: e.target.checked })}
										>
											Обязательное
										</Checkbox>
										<Checkbox
											checked={Boolean(item.multiple)}
											disabled={flagsDisabled}
											onChange={(e) => updateLink(key, { multiple: e.target.checked })}
										>
											Множественное
										</Checkbox>
									</Flex>
								);
							},
						},
						{
							title: '',
							key: 'actions',
							width: 72,
							render: (_: unknown, [key, item]: [string, PropertyLinkItem]) => {
								const isReadonly = readOnly || Boolean(item.readonly);
								return (
									<Flex gap={4} wrap="nowrap">
										{onOpenType ? (
											<Button
												type="text"
												aria-label="Открыть тип"
												icon={<IconExternalLink size={16} />}
												onClick={() => onOpenType(item.type_kind, item.type_id)}
											/>
										) : null}
										{!isReadonly ? (
											<Button
												type="text"
												danger
												aria-label="Удалить связь"
												icon={<IconTrash size={16} />}
												onClick={() => removeLink(key)}
											/>
										) : null}
									</Flex>
								);
							},
						},
					]}
				/>
			)}

			<Modal
				open={modalMode === 'component'}
				onCancel={closeModal}
				title="Присоединить к Типу комплектующему"
				centered
				footer={[
					<Button key="cancel" onClick={closeModal}>
						Отмена
					</Button>,
					<Button key="submit" type="primary" disabled={!selectedType} onClick={() => addDirectTypeLink('component')}>
						Присоединить
					</Button>,
				]}
			>
				<Form.Item label="Тип комплектующего" style={{ marginBottom: 0 }}>
					<Select
						placeholder="Выберите тип"
						options={componentTypeOptions}
						value={selectedType}
						onChange={setSelectedType}
						showSearch
						notFoundContent="Нет доступных типов"
					/>
				</Form.Item>
			</Modal>

			<Modal
				open={modalMode === 'device'}
				onCancel={closeModal}
				title="Присоединить к Типу устройств"
				centered
				footer={[
					<Button key="cancel" onClick={closeModal}>
						Отмена
					</Button>,
					<Button key="submit" type="primary" disabled={!selectedType} onClick={() => addDirectTypeLink('device')}>
						Присоединить
					</Button>,
				]}
			>
				<Form.Item label="Тип устройства" style={{ marginBottom: 0 }}>
					<Select
						placeholder="Выберите тип"
						options={deviceTypeOptions}
						value={selectedType}
						onChange={setSelectedType}
						showSearch
						notFoundContent="Нет доступных типов"
					/>
				</Form.Item>
			</Modal>

			<Modal
				open={modalMode === 'existing'}
				onCancel={closeModal}
				title="Связать с существующими свойствами комплектующих"
				centered
				width={640}
				footer={[
					<Button key="cancel" onClick={closeModal}>
						Отмена
					</Button>,
					<Button key="submit" type="primary" disabled={!selectedExisting} onClick={addExistingPropertyLink}>
						Связать
					</Button>,
				]}
			>
				<Form.Item label="Свойство типа комплектующего" style={{ marginBottom: 0 }}>
					<Select
						placeholder="Выберите свойство"
						options={existingPropertyOptions}
						value={selectedExisting}
						onChange={setSelectedExisting}
						showSearch
						notFoundContent={
							componentListQuery.isLoading || componentDetailsQueries.some((q) => q.isLoading)
								? 'Загрузка...'
								: 'Нет доступных свойств'
						}
					/>
				</Form.Item>
			</Modal>
		</Flex>
	);
}
