import { NumberInput as NumberComponent, type NumberInputProps } from '@mantine/core';
import { useMemo, useState } from 'react';

interface NumberComponentProps extends NumberInputProps {
	round?: number;
}

export function NumberInput({
	value,
	defaultValue = 0,
	step: stepProp = 1,
	round = 1,
	onChange,
	...props
}: NumberComponentProps) {
	const decimals = Math.max(0, Math.log10(round));
	const [displayValue, setDisplayValue] = useState<number>(Number(defaultValue) / round);
	const step = stepProp / round;

	const formattedValue = useMemo(() => {
		return displayValue.toFixed(decimals);
	}, [displayValue, decimals]);

	const handleChange = (val: string | number) => {
		const numeric = typeof val === 'number' ? val : Number(val);
		setDisplayValue(numeric);
		onChange?.(numeric * round);
	};

	return (
		<NumberComponent
			value={formattedValue}
			decimalScale={decimals}
			step={step}
			onChange={handleChange}
			{...props}
		/>
	);
}
