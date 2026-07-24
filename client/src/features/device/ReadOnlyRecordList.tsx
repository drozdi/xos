import { Flex, Form, Input } from 'antd';

interface ReadOnlyRecordListProps {
	records: Record<string, Record<string, unknown>> | undefined;
	labelFields?: string[];
	emptyLabel?: string;
}

export function ReadOnlyRecordList({
	records,
	labelFields = ['name', 'title', 'code', 'value'],
	emptyLabel = 'Нет записей',
}: ReadOnlyRecordListProps) {
	const entries = Object.entries(records ?? {});

	if (entries.length === 0) {
		return (
			<Form.Item label={emptyLabel} style={{ marginBottom: 0 }}>
				<Input value="" readOnly disabled />
			</Form.Item>
		);
	}

	return (
		<Flex vertical gap={8}>
			{entries.map(([key, item]) => {
				const label =
					labelFields.map((field) => item[field]).find((v) => v != null && v !== '') ??
					key;
				const details = Object.entries(item)
					.filter(([field]) => !labelFields.includes(field) && field !== 'id')
					.map(([field, value]) => `${field}: ${String(value ?? '')}`)
					.join(', ');

				return (
					<Form.Item key={key} label={String(label)} style={{ marginBottom: 0 }}>
						<Input value={details || String(label)} readOnly />
					</Form.Item>
				);
			})}
		</Flex>
	);
}
