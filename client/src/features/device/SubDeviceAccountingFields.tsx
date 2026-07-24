import { Checkbox, DatePicker, Flex, Form, Input, Select, Switch } from 'antd';
import dayjs from 'dayjs';

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

function toDayjs(value: unknown) {
	const parsed =
		value instanceof Date ? value : parseSubDeviceDate(value as string | null | undefined);
	if (!parsed) {
		return null;
	}
	const d = dayjs(parsed);
	return d.isValid() ? d : null;
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
		<Flex vertical gap={12}>
			{linkedToParent ? (
				<Form.Item label="Родительский учёт" style={{ marginBottom: 0 }}>
					<Input value={linkedParentLabel} readOnly />
				</Form.Item>
			) : null}

			<Form.Item label="Инв. №" style={{ marginBottom: 0 }}>
				<Input
					value={acc.inNo ?? ''}
					readOnly={fieldsDisabled}
					onChange={(e) => setField('inNo', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Счёт" style={{ marginBottom: 0 }}>
				<Input
					value={acc.invoice ?? ''}
					readOnly={fieldsDisabled}
					onChange={(e) => setField('invoice', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Дата счёта" style={{ marginBottom: 0 }}>
				<Input
					value={acc.dateInvoice ?? ''}
					readOnly={fieldsDisabled}
					onChange={(e) => setField('dateInvoice', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Наименование" style={{ marginBottom: 0 }}>
				<Input
					value={acc.name ?? ''}
					readOnly={fieldsDisabled}
					onChange={(e) => setField('name', e.target.value)}
				/>
			</Form.Item>

			{!linkedToParent ? (
				<>
					<Form.Item label="Списано" style={{ marginBottom: 0 }}>
						<Switch
							checked={Boolean(acc.discarded)}
							disabled={readOnly}
							onChange={(checked) => {
								onChange({
									...acc,
									discarded: checked,
									dateDiscarded: checked
										? acc.dateDiscarded || formatSubDeviceDate(new Date())
										: '',
								});
							}}
						/>
					</Form.Item>
					{Boolean(acc.discarded) ? (
						<Form.Item label="Дата списания" style={{ marginBottom: 0 }}>
							<DatePicker
								value={toDayjs(acc.dateDiscarded)}
								format="DD.MM.YYYY"
								disabled={readOnly}
								allowClear
								style={{ width: '100%' }}
								onChange={(value) => {
									if (!value) {
										onChange({
											...acc,
											discarded: false,
											dateDiscarded: '',
										});
										return;
									}
									setField('dateDiscarded', formatSubDeviceDate(value.toDate()));
								}}
							/>
						</Form.Item>
					) : null}
					<Form.Item label="Родительский учёт" style={{ marginBottom: 0 }}>
						<Select
							options={parentOptions}
							value={acc.parent_id != null ? String(acc.parent_id) : undefined}
							disabled={readOnly}
							showSearch
							allowClear
							optionFilterProp="label"
							style={{ width: '100%' }}
							onChange={(value) => setField('parent_id', value ? Number(value) : null)}
						/>
					</Form.Item>
				</>
			) : (
				<>
					<Form.Item label="Списано" style={{ marginBottom: 0 }}>
						<Switch checked={Boolean(acc.discarded)} disabled />
					</Form.Item>
					{acc.dateDiscarded ? (
						<Form.Item label="Дата списания" style={{ marginBottom: 0 }}>
							<Input value={acc.dateDiscarded} readOnly />
						</Form.Item>
					) : null}
					{!readOnly ? (
						<Checkbox
							checked={Boolean(acc.detachParent)}
							onChange={(e) => setField('detachParent', e.target.checked)}
						>
							Отвязать от родительского учёта
						</Checkbox>
					) : null}
				</>
			)}
		</Flex>
	);
}
