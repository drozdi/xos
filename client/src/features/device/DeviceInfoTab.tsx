import { Group, Stack, Text, Textarea, TextInput } from '@mantine/core';

interface DeviceInfoTabProps {
	data: {
		dateCreated?: string | null;
		createdBy?: string | null;
		xTimestamp?: string | null;
		modifiedBy?: string | null;
		log?: string | null;
	};
	layout?: 'fields' | 'rows';
}

function infoRows(data: DeviceInfoTabProps['data']) {
	return [
		{ label: 'Дата создания', value: data.dateCreated },
		{ label: 'Создал', value: data.createdBy },
		{ label: 'Изменено', value: data.xTimestamp },
		{ label: 'Изменил', value: data.modifiedBy },
	];
}

export function DeviceInfoTab({ data, layout = 'fields' }: DeviceInfoTabProps) {
	if (layout === 'rows') {
		return (
			<Stack gap="xs">
				{infoRows(data).map((row) => (
					<Group key={row.label} justify="space-between" align="flex-start" wrap="nowrap" gap="md">
						<Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
							{row.label}
						</Text>
						<Text size="sm" ta="right" style={{ wordBreak: 'break-word' }}>
							{row.value?.trim() ? row.value : '—'}
						</Text>
					</Group>
				))}
				<Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
					<Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
						Журнал
					</Text>
					<Text size="sm" ta="right" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
						{data.log?.trim() ? data.log : '—'}
					</Text>
				</Group>
			</Stack>
		);
	}

	return (
		<Stack gap="sm">
			<TextInput label="Дата создания" value={data.dateCreated ?? ''} readOnly />
			<TextInput label="Создал" value={data.createdBy ?? ''} readOnly />
			<TextInput label="Изменено" value={data.xTimestamp ?? ''} readOnly />
			<TextInput label="Изменил" value={data.modifiedBy ?? ''} readOnly />
			<Textarea label="Журнал" value={data.log ?? ''} readOnly minRows={4} autosize />
		</Stack>
	);
}
