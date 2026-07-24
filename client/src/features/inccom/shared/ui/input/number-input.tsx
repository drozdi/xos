import { InputNumber, type InputNumberProps } from 'antd';
import { useMemo, useState } from 'react';

interface NumberInputProps extends Omit<InputNumberProps, 'onChange' | 'value' | 'defaultValue'> {
	round?: number;
	value?: number | string;
	defaultValue?: number | string;
	onChange?: (value: number) => void;
	label?: React.ReactNode;
	description?: React.ReactNode;
	error?: React.ReactNode;
	thousandSeparator?: string;
	decimalSeparator?: string;
	decimalScale?: number;
	fixedDecimalScale?: boolean;
}

export function NumberInput({
	value,
	defaultValue = 0,
	step: stepProp = 1,
	round = 1,
	onChange,
	label,
	description,
	error,
	thousandSeparator: _thousandSeparator,
	decimalSeparator: _decimalSeparator,
	decimalScale,
	fixedDecimalScale: _fixedDecimalScale,
	style,
	...props
}: NumberInputProps) {
	void _thousandSeparator;
	void _decimalSeparator;
	void _fixedDecimalScale;
	const decimals = decimalScale ?? Math.max(0, Math.log10(round));
	const [displayValue, setDisplayValue] = useState<number>(Number(defaultValue) / round);
	const step = Number(stepProp) / round;

	const controlled =
		value !== undefined ? Number(value) / round : undefined;

	const formattedPrecision = useMemo(() => decimals, [decimals]);

	const handleChange = (val: number | string | null) => {
		const numeric = typeof val === 'number' ? val : Number(val);
		if (Number.isNaN(numeric)) {
			return;
		}
		setDisplayValue(numeric);
		onChange?.(numeric * round);
	};

	return (
		<div style={{ width: '100%', ...style }}>
			{label ? <div style={{ marginBottom: 4 }}>{label}</div> : null}
			{description ? (
				<div style={{ marginBottom: 4, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
					{description}
				</div>
			) : null}
			<InputNumber
				value={controlled ?? displayValue}
				precision={formattedPrecision}
				step={step}
				style={{ width: '100%' }}
				status={error ? 'error' : undefined}
				onChange={handleChange}
				{...props}
			/>
			{error ? <div style={{ color: '#ff4d4f', fontSize: 12 }}>{error}</div> : null}
		</div>
	);
}
