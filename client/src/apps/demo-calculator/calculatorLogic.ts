export const ZERO_DIVISION_ERROR = "Can't divide with 0";

export const CALCULATOR_BUTTON_MATRIX: Array<Array<string | number>> = [
	['C', '+-', '%', '/'],
	[7, 8, 9, '*'],
	[4, 5, 6, '-'],
	[1, 2, 3, '+'],
	[0, '.', '='],
];

const OPERATOR_KEYS = ['+', '-', '*', '/'] as const;
const DISABLED_ON_ZERO_DIVISION = ['+-', '%', '/', '*', '+', '-', '.'];

export interface CalculatorOperands {
	expr1: string;
	expr2: string;
	sign: string;
	prev: string;
}

export interface CalculatorState extends CalculatorOperands {
	disabled: string[];
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
	expr1: '0',
	expr2: '',
	sign: '',
	prev: '',
	disabled: [],
};

export function getCalculatorTitle(state: CalculatorOperands): string {
	if (!state.sign || state.prev) {
		return state.expr1;
	}
	return state.expr2;
}

export function getCalculatorSubtitle(state: CalculatorOperands): string {
	if (!state.sign) {
		return '';
	}
	if (state.prev) {
		return state.prev;
	}
	return `${state.expr1} ${state.sign}`;
}

export function formatButtonLabel(value: string | number): string {
	const key = String(value);
	if (key === '+-') {
		return '±';
	}
	if (key === '/') {
		return '÷';
	}
	if (key === '*') {
		return '×';
	}
	return key;
}

export function getButtonSpan(value: string | number): number {
	return String(value) === '=' ? 6 : 3;
}

export type CalculatorButtonGroup = 'function' | 'digit' | 'operator';

export function getCalculatorButtonGroup(key: string): CalculatorButtonGroup {
	if (key === 'C' || key === '+-' || key === '%') {
		return 'function';
	}
	if ('/*-+='.includes(key)) {
		return 'operator';
	}
	return 'digit';
}

export function getCalculatorButtonProps(key: string): {
	variant: 'filled';
	color: string;
} {
	const group = getCalculatorButtonGroup(key);
	if (group === 'function') {
		return { variant: 'filled', color: 'gray' };
	}
	if (group === 'operator') {
		return { variant: 'filled', color: 'orange' };
	}
	return { variant: 'filled', color: 'dark' };
}

function enableAll(): string[] {
	return [];
}

function disableAfterZeroDivision(): string[] {
	return [...DISABLED_ON_ZERO_DIVISION];
}

export function pressCalculatorKey(
	state: CalculatorState,
	key: string,
): CalculatorState {
	if (key === 'C' || state.expr2 === ZERO_DIVISION_ERROR) {
		return resetCalculator(key !== 'C' ? key : '0');
	}

	if (key === '+-') {
		return invertSign(state);
	}

	if (key === '=') {
		return calculateEqual(state);
	}

	if (key === '%') {
		return applyPercent(state);
	}

	if (OPERATOR_KEYS.includes(key as (typeof OPERATOR_KEYS)[number])) {
		return applyOperator(state, key);
	}

	if (key === '.' || key === ',') {
		return inputDecimal(state);
	}

	return inputDigit(state, key);
}

export function resetCalculator(expr1 = '0'): CalculatorState {
	return {
		...INITIAL_CALCULATOR_STATE,
		expr1,
	};
}

function invertSign(state: CalculatorState): CalculatorState {
	if (state.prev || !state.sign) {
		return {
			...state,
			expr1: String(Number(state.expr1) * -1),
		};
	}

	return {
		...state,
		expr2: String(Number(state.expr2) * -1),
	};
}

function inputDigit(state: CalculatorState, digit: string): CalculatorState {
	if (state.prev) {
		return {
			...resetCalculator(digit),
			disabled: enableAll(),
		};
	}

	if (state.sign) {
		return {
			...state,
			expr2: state.expr2 ? state.expr2 + digit : digit,
		};
	}

	return {
		...state,
		expr1: state.expr1 !== '0' ? state.expr1 + digit : digit,
	};
}

function inputDecimal(state: CalculatorState): CalculatorState {
	if (state.sign) {
		if (state.expr2.includes('.')) {
			return state;
		}
		return {
			...state,
			expr2: state.expr2 ? `${state.expr2}.` : '0.',
		};
	}

	if (state.expr1.includes('.')) {
		return state;
	}

	return {
		...state,
		expr1: state.expr1 ? `${state.expr1}.` : '0.',
	};
}

function applyOperator(state: CalculatorState, sign: string): CalculatorState {
	return {
		...state,
		sign,
		expr2: '',
		prev: '',
	};
}

function calculateEqual(state: CalculatorState): CalculatorState {
	const num1 = Number(state.expr1);
	const num2 = Number(state.expr2);
	const expression = `${state.expr1} ${state.sign} ${state.expr2}`;

	switch (state.sign) {
		case '+':
			return {
				...state,
				prev: expression,
				expr1: String(num1 + num2),
				disabled: enableAll(),
			};
		case '-':
			return {
				...state,
				prev: expression,
				expr1: String(num1 - num2),
				disabled: enableAll(),
			};
		case '*':
			return {
				...state,
				prev: expression,
				expr1: String(num1 * num2),
				disabled: enableAll(),
			};
		case '/':
			if (!num2) {
				return {
					...state,
					expr2: ZERO_DIVISION_ERROR,
					prev: '',
					disabled: disableAfterZeroDivision(),
				};
			}
			return {
				...state,
				prev: expression,
				expr1: String(num1 / num2),
				disabled: enableAll(),
			};
		default:
			return state;
	}
}

function applyPercent(state: CalculatorState): CalculatorState {
	if (state.sign === '') {
		return calculateEqual(resetCalculator());
	}

	if ('+-'.includes(state.sign)) {
		const percentValue = String(Number(state.expr1) * (Number(state.expr2) / 100));
		const withPercent = {
			...state,
			expr2: percentValue,
		};
		const calculated = calculateEqual(withPercent);
		return {
			...calculated,
			prev: `${state.expr1} ${state.sign} ${state.expr2}%`,
		};
	}

	if ('*/'.includes(state.sign)) {
		return {
			...state,
			expr2: String(Number(state.expr2) / 100),
		};
	}

	return state;
}

export function mapKeyboardKey(key: string): string | null {
	if (key === ',') {
		return '.';
	}
	if (key === 'Enter' || key === '=') {
		return '=';
	}
	if (key === 'Escape' || key === 'Delete' || key === 'Backspace') {
		return 'C';
	}
	if (key === 'x' || key === 'X') {
		return '*';
	}
	if (/^[0-9+\-*/.%]$/.test(key)) {
		return key;
	}
	return null;
}

export function shouldPreventKeyboardDefault(key: string): boolean {
	return /[0-9+\-*/.%,=]|Enter|Escape|Backspace|Delete/.test(key);
}
