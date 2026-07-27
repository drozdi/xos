import { Stack, TextInput } from '@mantine/core';

import { normalizeIdRecord } from '@/features/device/deviceAppUtils';

interface DeviceImagesTabProps {
	images: unknown;
}

export function DeviceImagesTab({ images }: DeviceImagesTabProps) {
	const records = normalizeIdRecord(images);
	const entries = Object.entries(records);

	if (entries.length === 0) {
		return <TextInput label="Нет изображений" value="" readOnly disabled />;
	}

	return (
		<Stack gap="xs">
			{entries.map(([key, item]) => (
				<TextInput
					key={key}
					label={String(item.name ?? `Изображение #${key}`)}
					value={String(item.src ?? '')}
					readOnly
				/>
			))}
		</Stack>
	);
}
