import { Anchor, Button, FileButton, Group, NumberInput, Select, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DeviceDetail } from '@/core/api/endpoints/deviceApi';
import { deviceApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { notifyApiError } from '@/core/api/apiError';

interface DeviceGeneralTabProps {
	data: DeviceDetail;
	deviceId: number;
	errors: Partial<Record<keyof DeviceDetail & string, string>>;
	readOnly: boolean;
	setField: <K extends keyof DeviceDetail>(key: K, value: DeviceDetail[K]) => void;
}

export function DeviceGeneralTab({ data, deviceId, errors, readOnly, setField }: DeviceGeneralTabProps) {
	const filterQuery = useQuery({
		queryKey: queryKeys.device.filter,
		queryFn: () => deviceApi.filter(),
	});

	const typeOptions = useMemo(() => {
		const options: { value: string; label: string }[] = [];
		for (const item of filterQuery.data ?? []) {
			if (item.type === 'divider' || item.value == null) {
				continue;
			}
			const prefix = item.type === 'subheader' ? '▸ ' : '';
			options.push({
				value: String(item.value),
				label: `${prefix}${item.label ?? item.value}`,
			});
		}
		return options;
	}, [filterQuery.data]);

	return (
		<Stack gap="sm">
			<TextInput
				label="Название"
				withAsterisk
				value={data.name ?? ''}
				error={errors.name}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<TextInput
				label="Код"
				withAsterisk
				value={data.code ?? ''}
				error={errors.code}
				readOnly={readOnly}
				onChange={(e) => setField('code', e.currentTarget.value)}
			/>
			<Select
				label="Тип"
				data={typeOptions}
				value={data.typeId ? String(data.typeId) : null}
				readOnly={readOnly}
				onChange={(value) => setField('typeId', value ? Number(value) : null)}
				searchable
				clearable
			/>
			<NumberInput
				label="Сортировка"
				value={data.sort ?? 0}
				readOnly={readOnly}
				onChange={(value) => setField('sort', typeof value === 'number' ? value : 0)}
			/>
			<Textarea
				label="Описание"
				value={data.description ?? ''}
				readOnly={readOnly}
				minRows={3}
				autosize
				onChange={(e) => setField('description', e.currentTarget.value)}
			/>

			<Stack gap="xs">
				<Text size="sm" fw={500}>
					Файл из API
				</Text>
				{deviceId <= 0 ? (
					<Text size="sm" c="dimmed">
						Сохраните устройство, чтобы загрузить файл
					</Text>
				) : !readOnly ? (
					<Group>
						<FileButton
							onChange={async (file) => {
								if (!file) {
									return;
								}
								try {
									const uploaded = await deviceApi.uploadFile(deviceId, file);
									setField('file', uploaded);
									notifications.show({ color: 'green', message: 'Файл загружен' });
								} catch (error) {
									notifyApiError(error, 'Ошибка загрузки файла');
								}
							}}
						>
							{(props) => (
								<Button
									{...props}
									variant="light"
									leftSection={<IconUpload size={16} />}
								>
									Загрузить файл
								</Button>
							)}
						</FileButton>
						{data.file ? (
							<Button
								variant="light"
								color="red"
								leftSection={<IconTrash size={16} />}
								onClick={() => setField('file', null)}
							>
								Удалить файл
							</Button>
						) : null}
					</Group>
				) : null}
				{data.file ? (
					<Anchor href={data.file.src} target="_blank" download={data.file.name}>
						{data.file.name}
					</Anchor>
				) : (
					<Text size="sm" c="dimmed">
						Файл не загружен
					</Text>
				)}
				{!readOnly && data.file ? (
					<Text size="xs" c="dimmed">
						Удаление файла вступит в силу после нажатия «Сохранить»
					</Text>
				) : null}
			</Stack>
		</Stack>
	);
}
