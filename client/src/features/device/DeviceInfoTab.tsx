import { Flex, Form, Input, Typography } from 'antd';

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
			<Flex vertical gap={8}>
				{infoRows(data).map((row) => (
					<Flex key={row.label} justify="space-between" align="flex-start" gap={16} wrap="nowrap">
						<Typography.Text type="secondary" style={{ flexShrink: 0, fontSize: 13 }}>
							{row.label}
						</Typography.Text>
						<Typography.Text style={{ fontSize: 13, textAlign: 'right', wordBreak: 'break-word' }}>
							{row.value?.trim() ? row.value : '—'}
						</Typography.Text>
					</Flex>
				))}
				<Flex justify="space-between" align="flex-start" gap={16} wrap="nowrap">
					<Typography.Text type="secondary" style={{ flexShrink: 0, fontSize: 13 }}>
						Журнал
					</Typography.Text>
					<Typography.Text
						style={{
							fontSize: 13,
							textAlign: 'right',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}
					>
						{data.log?.trim() ? data.log : '—'}
					</Typography.Text>
				</Flex>
			</Flex>
		);
	}

	return (
		<Flex vertical gap={12}>
			<Form.Item label="Дата создания" style={{ marginBottom: 0 }}>
				<Input value={data.dateCreated ?? ''} readOnly />
			</Form.Item>
			<Form.Item label="Создал" style={{ marginBottom: 0 }}>
				<Input value={data.createdBy ?? ''} readOnly />
			</Form.Item>
			<Form.Item label="Изменено" style={{ marginBottom: 0 }}>
				<Input value={data.xTimestamp ?? ''} readOnly />
			</Form.Item>
			<Form.Item label="Изменил" style={{ marginBottom: 0 }}>
				<Input value={data.modifiedBy ?? ''} readOnly />
			</Form.Item>
			<Form.Item label="Журнал" style={{ marginBottom: 0 }}>
				<Input.TextArea value={data.log ?? ''} readOnly rows={4} autoSize={{ minRows: 4 }} />
			</Form.Item>
		</Flex>
	);
}
