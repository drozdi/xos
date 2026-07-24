import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useDateSettings } from './DatesSettingsProvider';

dayjs.extend(customParseFormat);

interface DateTimeFieldProps {
	label: string;
	value: string | null | undefined;
	onChange: (value: string | null) => void;
	readOnly?: boolean;
	error?: string;
	withSeconds?: boolean;
}

function toDayjs(value: string | null | undefined): Dayjs | null {
	if (!value) {
		return null;
	}
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed : null;
}

export function DateTimeField({
	label,
	value,
	onChange,
	readOnly,
	error,
	withSeconds = false,
}: DateTimeFieldProps) {
	const { timeFormat } = useDateSettings();
	const format = withSeconds
		? timeFormat.includes('ss')
			? timeFormat
			: `${timeFormat}:ss`
		: timeFormat.replace(/:?ss/, '');

	return (
		<div>
			{label ? <div style={{ marginBottom: 4 }}>{label}</div> : null}
			<DatePicker
				showTime={{ format: withSeconds ? 'HH:mm:ss' : 'HH:mm' }}
				value={toDayjs(value)}
				format={format}
				allowClear
				disabled={readOnly}
				status={error ? 'error' : undefined}
				style={{ width: '100%' }}
				onChange={(next) => {
					onChange(next ? next.format('YYYY-MM-DD HH:mm:ss') : null);
				}}
			/>
			{error ? <div style={{ color: '#ff4d4f', fontSize: 12 }}>{error}</div> : null}
		</div>
	);
}
