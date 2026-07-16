import { describe, expect, it } from 'vitest';

import {
	checkGameResult,
	createEmptyField,
	generateWinLines,
	type CellValue,
} from '../gameLogic';

describe('generateWinLines', () => {
	it('generates 8 lines for classic 3x3', () => {
		expect(generateWinLines(3, 3)).toHaveLength(8);
	});
});

describe('checkGameResult', () => {
	it('detects a winner on the top row', () => {
		const field = createEmptyField(3);
		field[0] = 'X';
		field[1] = 'X';
		field[2] = 'X';

		expect(checkGameResult(field, generateWinLines(3, 3))).toEqual({
			status: 'win',
			player: 'X',
		});
	});

	it('detects a winner with 4 in a row on 4x4', () => {
		const field = createEmptyField(4);
		field[0] = 'O';
		field[1] = 'O';
		field[2] = 'O';
		field[3] = 'O';

		expect(checkGameResult(field, generateWinLines(4, 4))).toEqual({
			status: 'win',
			player: 'O',
		});
	});

	it('detects a draw', () => {
		const field = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as CellValue[];

		expect(checkGameResult(field, generateWinLines(3, 3))).toEqual({ status: 'draw' });
	});

	it('returns playing for an unfinished game', () => {
		expect(checkGameResult(createEmptyField(3), generateWinLines(3, 3))).toEqual({
			status: 'playing',
		});
	});
});
