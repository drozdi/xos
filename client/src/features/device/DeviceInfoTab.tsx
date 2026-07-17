import { Stack, Textarea, TextInput } from '@mantine/core';

interface DeviceInfoTabProps {
	data: {
		dateCreated?: string | null;
		createdBy?: string | null;
		xTimestamp?: string | null;
		modifiedBy?: string | null;
		log?: string | null;
	};
}

export function DeviceInfoTab({ data }: DeviceInfoTabProps) {
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
