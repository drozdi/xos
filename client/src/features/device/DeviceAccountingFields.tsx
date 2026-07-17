import { NumberInput, Stack, Switch, TextInput } from '@mantine/core';

interface AccountingData {
	inNo?: string;
	invoice?: string;
	dateInvoice?: string;
	dateDiscarded?: string;
	discarded?: boolean | string;
	name?: string;
	parent_id?: number | null;
	isChild?: boolean;
}

interface DeviceAccountingFieldsProps {
	accounting: AccountingData | undefined;
	readOnly: boolean;
	onChange: (accounting: AccountingData) => void;
}

export function DeviceAccountingFields({
	accounting,
	readOnly,
	onChange,
}: DeviceAccountingFieldsProps) {
	const acc = accounting ?? {};

	const setField = (key: keyof AccountingData, value: unknown) => {
		onChange({ ...acc, [key]: value });
	};

	return (
		<Stack gap="sm">
			<TextInput
				label="Инв. №"
				value={acc.inNo ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('inNo', e.currentTarget.value)}
			/>
			<TextInput
				label="Счёт"
				value={acc.invoice ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('invoice', e.currentTarget.value)}
			/>
			<TextInput
				label="Дата счёта"
				value={acc.dateInvoice ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('dateInvoice', e.currentTarget.value)}
			/>
			<TextInput
				label="Дата списания"
				value={acc.dateDiscarded ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('dateDiscarded', e.currentTarget.value)}
			/>
			<TextInput
				label="Наименование"
				value={acc.name ?? ''}
				readOnly={readOnly}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>
			<Switch
				label="Списано"
				checked={Boolean(acc.discarded)}
				disabled={readOnly}
				onChange={(e) => setField('discarded', e.currentTarget.checked)}
			/>
			{acc.isChild ? (
				<NumberInput
					label="Родительский учёт (ID)"
					value={acc.parent_id ?? undefined}
					readOnly={readOnly}
					onChange={(value) =>
						setField('parent_id', typeof value === 'number' ? value : null)
					}
				/>
			) : null}
		</Stack>
	);
}
