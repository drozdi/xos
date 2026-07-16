import { describe, expect, it } from 'vitest';

import { checkGameResult, createEmptyField, type CellValue } from '../gameLogic';

describe('checkGameResult', () => {
	it('detects a winner on the top row', () => {
		const field = createEmptyField();
		field[0] = 'X';
		field[1] = 'X';
		field[2] = 'X';

		expect(checkGameResult(field)).toEqual({ status: 'win', player: 'X' });
	});

	it('detects a draw', () => {
		const field = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as CellValue[];

		expect(checkGameResult(field)).toEqual({ status: 'draw' });
	});

	it('returns playing for an unfinished game', () => {
		expect(checkGameResult(createEmptyField())).toEqual({ status: 'playing' });
	});
});
