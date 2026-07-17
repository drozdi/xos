import { Stack, TextInput } from '@mantine/core';

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
		return <TextInput label={emptyLabel} value="" readOnly disabled />;
	}

	return (
		<Stack gap="xs">
			{entries.map(([key, item]) => {
				const label =
					labelFields.map((field) => item[field]).find((v) => v != null && v !== '') ??
					key;
				const details = Object.entries(item)
					.filter(([field]) => !labelFields.includes(field) && field !== 'id')
					.map(([field, value]) => `${field}: ${String(value ?? '')}`)
					.join(', ');

				return (
					<TextInput
						key={key}
						label={String(label)}
						value={details || String(label)}
						readOnly
					/>
				);
			})}
		</Stack>
	);
}
