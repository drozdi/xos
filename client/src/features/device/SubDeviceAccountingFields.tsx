import { Checkbox, Select, Stack, Switch, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

import { formatSubDeviceDate, parseSubDeviceDate } from '@/features/device/subDeviceDateUtils';

interface AccountingOption {
	value: number;
	label: string;
}

interface SubDeviceAccountingData {
	inNo?: string;
	invoice?: string;
	dateInvoice?: string;
	dateDiscarded?: string;
	discarded?: boolean | string;
	name?: string;
	parent_id?: number | string | null;
	isChild?: boolean;
	detachParent?: boolean;
}

interface SubDeviceAccountingFieldsProps {
	accounting: SubDeviceAccountingData | undefined;
	parentAccountings: AccountingOption[];
	readOnly: boolean;
	onChange: (accounting: SubDeviceAccountingData) => void;
}

function hasLinkedParentAccounting(acc: SubDeviceAccountingData): boolean {
	return (
		Boolean(acc.isChild) ||
		(acc.parent_id != null && acc.parent_id !== '' && Number(acc.parent_id) > 0)
	);
}

export function SubDeviceAccountingFields({
	accounting,
	parentAccountings,
	readOnly,
	onChange,
}: SubDeviceAccountingFieldsProps) {
	const acc = accounting ?? {};
	const linkedToParent = hasLinkedParentAccounting(acc);
	const fieldsDisabled = readOnly || (linkedToParent && !acc.detachParent);

	const setField = (key: keyof SubDeviceAccountingData, value: unknown) => {
		onChange({ ...acc, [key]: value });
	};

	const parentOptions = parentAccountings.map((item) => ({
		value: String(item.value),
		label: item.label,
	}));

	const linkedParentLabel =
		parentOptions.find((item) => item.value === String(acc.parent_id))?.label ??
		(acc.parent_id ? `Учёт #${acc.parent_id}` : '');

	return (
		<Stack gap="sm">
			{linkedToParent ? (
				<TextInput
					label="Родительский учёт"
					value={linkedParentLabel}
					readOnly
				/>
			) : null}

			<TextInput
				label="Инв. №"
				value={acc.inNo ?? ''}
				readOnly={fieldsDisabled}
				onChange={(e) => setField('inNo', e.currentTarget.value)}
			/>
			<TextInput
				label="Счёт"
				value={acc.invoice ?? ''}
				readOnly={fieldsDisabled}
				onChange={(e) => setField('invoice', e.currentTarget.value)}
			/>
			<TextInput
				label="Дата счёта"
				value={acc.dateInvoice ?? ''}
				readOnly={fieldsDisabled}
				onChange={(e) => setField('dateInvoice', e.currentTarget.value)}
			/>
			<TextInput
				label="Наименование"
				value={acc.name ?? ''}
				readOnly={fieldsDisabled}
				onChange={(e) => setField('name', e.currentTarget.value)}
			/>

			{!linkedToParent ? (
				<>
					<Switch
						label="Списано"
						checked={Boolean(acc.discarded)}
						disabled={readOnly}
						onChange={(e) => {
							const checked = e.currentTarget.checked;
							onChange({
								...acc,
								discarded: checked,
								dateDiscarded: checked
									? acc.dateDiscarded || formatSubDeviceDate(new Date())
									: '',
							});
						}}
					/>
					{Boolean(acc.discarded) ? (
						<DatePickerInput
							label="Дата списания"
							value={parseSubDeviceDate(acc.dateDiscarded)}
							valueFormat="DD.MM.YYYY"
							readOnly={readOnly}
							clearable
							onChange={(value) => {
								if (!value) {
									onChange({
										...acc,
										discarded: false,
										dateDiscarded: '',
									});
									return;
								}
								setField('dateDiscarded', formatSubDeviceDate(value));
							}}
						/>
					) : null}
					<Select
						label="Родительский учёт"
						data={parentOptions}
						value={acc.parent_id != null ? String(acc.parent_id) : null}
						disabled={readOnly}
						searchable
						clearable
						onChange={(value) =>
							setField('parent_id', value ? Number(value) : null)
						}
					/>
				</>
			) : (
				<>
					<Switch
						label="Списано"
						checked={Boolean(acc.discarded)}
						disabled
					/>
					{acc.dateDiscarded ? (
						<TextInput label="Дата списания" value={acc.dateDiscarded} readOnly />
					) : null}
					{!readOnly ? (
						<Checkbox
							label="Отвязать от родительского учёта"
							checked={Boolean(acc.detachParent)}
							onChange={(e) => setField('detachParent', e.currentTarget.checked)}
						/>
					) : null}
				</>
			)}
		</Stack>
	);
}
