import { describe, expect, it } from 'vitest';

import {
	getCalculatorButtonProps,
	getCalculatorSubtitle,
	getCalculatorTitle,
	INITIAL_CALCULATOR_STATE,
	pressCalculatorKey,
	ZERO_DIVISION_ERROR,
} from '../calculatorLogic';

describe('calculatorLogic', () => {
	it('shows expr1 as title before operator is chosen', () => {
		const state = { ...INITIAL_CALCULATOR_STATE, expr1: '42' };
		expect(getCalculatorTitle(state)).toBe('42');
		expect(getCalculatorSubtitle(state)).toBe('');
	});

	it('shows expr2 while entering second operand', () => {
		const state = { ...INITIAL_CALCULATOR_STATE, expr1: '10', expr2: '3', sign: '+' };
		expect(getCalculatorTitle(state)).toBe('3');
		expect(getCalculatorSubtitle(state)).toBe('10 +');
	});

	it('calculates addition on equal', () => {
		const state = pressCalculatorKey(
			{ ...INITIAL_CALCULATOR_STATE, expr1: '2', expr2: '3', sign: '+' },
			'=',
		);
		expect(state.expr1).toBe('5');
		expect(state.prev).toBe('2 + 3');
	});

	it('blocks division by zero', () => {
		const state = pressCalculatorKey(
			{ ...INITIAL_CALCULATOR_STATE, expr1: '8', expr2: '0', sign: '/' },
			'=',
		);
		expect(state.expr2).toBe(ZERO_DIVISION_ERROR);
		expect(state.disabled).toContain('/');
	});

	it('applies percent for addition', () => {
		const state = pressCalculatorKey(
			{ ...INITIAL_CALCULATOR_STATE, expr1: '200', expr2: '10', sign: '+' },
			'%',
		);
		expect(state.expr1).toBe('220');
		expect(state.prev).toBe('200 + 10%');
	});
});

describe('getCalculatorButtonProps', () => {
	it('groups buttons like a standard calculator', () => {
		expect(getCalculatorButtonProps('7').color).toBe('dark');
		expect(getCalculatorButtonProps('C').color).toBe('gray');
		expect(getCalculatorButtonProps('+').color).toBe('orange');
	});
});
