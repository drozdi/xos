import { Flex, Form, Input, InputNumber, Switch } from 'antd';

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
		<Flex vertical gap={12}>
			<Form.Item label="Инв. №" style={{ marginBottom: 0 }}>
				<Input
					value={acc.inNo ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('inNo', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Счёт" style={{ marginBottom: 0 }}>
				<Input
					value={acc.invoice ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('invoice', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Дата счёта" style={{ marginBottom: 0 }}>
				<Input
					value={acc.dateInvoice ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('dateInvoice', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Дата списания" style={{ marginBottom: 0 }}>
				<Input
					value={acc.dateDiscarded ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('dateDiscarded', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Наименование" style={{ marginBottom: 0 }}>
				<Input
					value={acc.name ?? ''}
					readOnly={readOnly}
					onChange={(e) => setField('name', e.target.value)}
				/>
			</Form.Item>
			<Form.Item label="Списано" style={{ marginBottom: 0 }}>
				<Switch
					checked={Boolean(acc.discarded)}
					disabled={readOnly}
					onChange={(checked) => setField('discarded', checked)}
				/>
			</Form.Item>
			{acc.isChild ? (
				<Form.Item label="Родительский учёт (ID)" style={{ marginBottom: 0 }}>
					<InputNumber
						value={acc.parent_id ?? undefined}
						disabled={readOnly}
						style={{ width: '100%' }}
						onChange={(value) =>
							setField('parent_id', typeof value === 'number' ? value : null)
						}
					/>
				</Form.Item>
			) : null}
		</Flex>
	);
}
