import { Button, Flex, Input, Select, Table, Typography } from 'antd';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { deviceSoftwareApi } from '@/core/api/endpoints/deviceApi';
import { nextTempId } from '@/features/device/deviceAppUtils';

import { LICENSE_KEY_TYPES } from '../device-license/constants';

type KeyRecord = Record<string, unknown>;

interface LicenseKeysEditorProps {
	typeId: number | null | undefined;
	records: Record<string, KeyRecord>;
	readOnly: boolean;
	onChange: (records: Record<string, KeyRecord>) => void;
}

export function LicenseKeysEditor({
	typeId,
	records,
	readOnly,
	onChange,
}: LicenseKeysEditorProps) {
	const softwareQuery = useQuery({
		queryKey: ['device', 'software', 'license-keys', typeId],
		queryFn: () =>
			deviceSoftwareApi.list({
				limit: -1,
				offset: 1,
				filters: typeId ? { type: typeId, parent: null } : { parent: null },
			}),
		enabled: typeId != null,
	});

	const softwareOptions = useMemo(
		() =>
			(softwareQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.name || String(item.id),
			})),
		[softwareQuery.data?.items],
	);

	const keyTypeOptions = useMemo(
		() => LICENSE_KEY_TYPES.map((value) => ({ value, label: value })),
		[],
	);

	const entries = Object.entries(records ?? {});

	const updateItem = (key: string, patch: Partial<KeyRecord>) => {
		onChange({
			...records,
			[key]: {
				...records[key],
				...patch,
			},
		});
	};

	const removeItem = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addItem = () => {
		const id = nextTempId();
		onChange({
			...records,
			[id]: {
				id: 0,
				software_id: '',
				typeKey: '',
				value: '',
				actived: '',
			},
		});
	};

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<strong>Ключи</strong>
				{!readOnly ? (
					<Button size="small" icon={<IconPlus size={14} />} onClick={addItem}>
						Добавить
					</Button>
				) : null}
			</Flex>

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет записей</Typography.Text>
			) : (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey={([key]) => key}
					dataSource={entries}
					columns={[
						{
							title: 'Программа',
							key: 'software',
							render: (_: unknown, [key, item]: [string, KeyRecord]) => (
								<Select
									options={softwareOptions}
									value={
										item.software_id != null && item.software_id !== ''
											? String(item.software_id)
											: undefined
									}
									disabled={readOnly || typeId == null}
									showSearch
									notFoundContent="Нет программ"
									style={{ width: '100%' }}
									onChange={(value) =>
										updateItem(key, {
											software_id: value ?? '',
										})
									}
								/>
							),
						},
						{
							title: 'Тип ключа',
							key: 'typeKey',
							width: 120,
							render: (_: unknown, [key, item]: [string, KeyRecord]) => (
								<Select
									options={keyTypeOptions}
									value={item.typeKey ? String(item.typeKey) : undefined}
									disabled={readOnly}
									style={{ width: '100%' }}
									onChange={(value) =>
										updateItem(key, {
											typeKey: value ?? '',
										})
									}
								/>
							),
						},
						{
							title: 'Ключ',
							key: 'value',
							render: (_: unknown, [key, item]: [string, KeyRecord]) => (
								<Input
									value={String(item.value ?? '')}
									readOnly={readOnly}
									onChange={(e) =>
										updateItem(key, {
											value: e.target.value,
										})
									}
								/>
							),
						},
						{
							title: 'Код активации',
							key: 'actived',
							render: (_: unknown, [key, item]: [string, KeyRecord]) => (
								<Input
									value={String(item.actived ?? '')}
									readOnly={readOnly}
									onChange={(e) =>
										updateItem(key, {
											actived: e.target.value,
										})
									}
								/>
							),
						},
						...(!readOnly
							? [
									{
										title: '',
										key: 'actions',
										width: 48,
										render: (_: unknown, [key]: [string, KeyRecord]) => (
											<Button
												type="text"
												danger
												aria-label="Удалить"
												icon={<IconTrash size={16} />}
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
	);
}
