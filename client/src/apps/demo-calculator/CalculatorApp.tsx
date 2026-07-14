import { Box, Button, Grid, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';

import { useCoreApi } from '@/core/hooks/useCoreApi';

type Operator = '+' | '-' | '*' | '/';

function calculate(left: number, right: number, operator: Operator): number {
	switch (operator) {
		case '+':
			return left + right;
		case '-':
			return left - right;
		case '*':
			return left * right;
		case '/':
			return right === 0 ? NaN : left / right;
	}
}

export default function CalculatorApp() {
	const coreApi = useCoreApi();
	const [display, setDisplay] = useState('0');
	const [storedValue, setStoredValue] = useState<number | null>(null);
	const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
	const [resetNext, setResetNext] = useState(false);

	useEffect(() => {
		const user = coreApi.auth.getUser();
		const displayName = user?.alias ?? user?.login ?? 'Guest';
		coreApi.window.setTitle(`Calculator — ${displayName}`);
	}, [coreApi]);

	const inputDigit = useCallback(
		(digit: string) => {
			setDisplay((current) => {
				if (resetNext) {
					setResetNext(false);
					return digit;
				}
				if (current === '0') {return digit;}
				return current + digit;
			});
		},
		[resetNext],
	);

	const inputDecimal = useCallback(() => {
		setDisplay((current) => {
			if (resetNext) {
				setResetNext(false);
				return '0.';
			}
			return current.includes('.') ? current : `${current}.`;
		});
	}, [resetNext]);

	const clearAll = useCallback(() => {
		setDisplay('0');
		setStoredValue(null);
		setPendingOperator(null);
		setResetNext(false);
	}, []);

	const applyOperator = useCallback(
		(operator: Operator) => {
			const currentValue = Number.parseFloat(display);
			if (storedValue !== null && pendingOperator && !resetNext) {
				const result = calculate(storedValue, currentValue, pendingOperator);
				setDisplay(Number.isFinite(result) ? String(result) : 'Error');
				setStoredValue(Number.isFinite(result) ? result : null);
			} else {
				setStoredValue(currentValue);
			}
			setPendingOperator(operator);
			setResetNext(true);
		},
		[display, pendingOperator, resetNext, storedValue],
	);

	const compute = useCallback(() => {
		if (storedValue === null || !pendingOperator) {return;}
		const currentValue = Number.parseFloat(display);
		const result = calculate(storedValue, currentValue, pendingOperator);
		setDisplay(Number.isFinite(result) ? String(result) : 'Error');
		setStoredValue(null);
		setPendingOperator(null);
		setResetNext(true);
	}, [display, pendingOperator, storedValue]);

	const toggleSign = useCallback(() => {
		setDisplay((current) => {
			if (current === '0' || current === 'Error') {return current;}
			return current.startsWith('-') ? current.slice(1) : `-${current}`;
		});
	}, []);

	const buttons: Array<{ label: string; onClick: () => void; span?: number; color?: string }> = [
		{ label: 'C', onClick: clearAll, color: 'red' },
		{ label: '±', onClick: toggleSign },
		{ label: '÷', onClick: () => applyOperator('/'), color: 'blue' },
		{ label: '×', onClick: () => applyOperator('*'), color: 'blue' },
		{ label: '7', onClick: () => inputDigit('7') },
		{ label: '8', onClick: () => inputDigit('8') },
		{ label: '9', onClick: () => inputDigit('9') },
		{ label: '-', onClick: () => applyOperator('-'), color: 'blue' },
		{ label: '4', onClick: () => inputDigit('4') },
		{ label: '5', onClick: () => inputDigit('5') },
		{ label: '6', onClick: () => inputDigit('6') },
		{ label: '+', onClick: () => applyOperator('+'), color: 'blue' },
		{ label: '1', onClick: () => inputDigit('1') },
		{ label: '2', onClick: () => inputDigit('2') },
		{ label: '3', onClick: () => inputDigit('3') },
		{ label: '=', onClick: compute, span: 1, color: 'blue' },
		{ label: '0', onClick: () => inputDigit('0'), span: 2 },
		{ label: '.', onClick: inputDecimal },
	];

	return (
		<Box p="md" h="100%">
			<Text
				ta="right"
				size="xl"
				fw={600}
				mb="md"
				style={{
					fontVariantNumeric: 'tabular-nums',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
			>
				{display}
			</Text>
			<Grid gap="xs">
				{buttons.map((button) => (
					<Grid.Col key={button.label} span={button.span ?? 3}>
						<Button
							fullWidth
							variant={button.color ? 'filled' : 'default'}
							color={button.color}
							onClick={button.onClick}
						>
							{button.label}
						</Button>
					</Grid.Col>
				))}
			</Grid>
		</Box>
	);
}
