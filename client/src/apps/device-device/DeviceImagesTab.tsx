import { Flex, Form, Input } from 'antd';

import { normalizeIdRecord } from '@/features/device/deviceAppUtils';

interface DeviceImagesTabProps {
	images: unknown;
}

export function DeviceImagesTab({ images }: DeviceImagesTabProps) {
	const records = normalizeIdRecord(images);
	const entries = Object.entries(records);

	if (entries.length === 0) {
		return (
			<Form.Item label="Нет изображений" style={{ marginBottom: 0 }}>
				<Input value="" readOnly disabled />
			</Form.Item>
		);
	}

	return (
		<Flex vertical gap={8}>
			{entries.map(([key, item]) => (
				<Form.Item key={key} label={String(item.name ?? `Изображение #${key}`)} style={{ marginBottom: 0 }}>
					<Input value={String(item.src ?? '')} readOnly />
				</Form.Item>
			))}
		</Flex>
	);
}
