import { DateTimePicker } from '@mantine/dates';

import { useDateSettings } from './DatesSettingsProvider';

interface DateTimeFieldProps {
	label: string;
	value: string | null | undefined;
	onChange: (value: string | null) => void;
	readOnly?: boolean;
	error?: string;
	withSeconds?: boolean;
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

	return (
		<DateTimePicker
			label={label}
			value={value ?? null}
			valueFormat={timeFormat}
			withSeconds={withSeconds}
			clearable
			disabled={readOnly}
			error={error}
			onChange={(next) => onChange(next)}
		/>
	);
}
