export const Figures = {
	BASE: 'Фигура',
	PAWN: 'Пешка',
	KING: 'Кароль',
	QUEEN: 'Ферзь',
	KNIGHT: 'Конь',
	BISHOP: 'Слон',
	ROOK: 'Ладья',
};

export class Base {
	color = null;
	cell = null;
	label = null;
	key = null;
	img = null;
	countSteps = 0;
	numStep = 0;

	constructor(color, cell) {
		this.color = color;
		this.cell = cell;
		this.cell.figure = this;
		this.img = null;
		this.key = Math.random();
		this.label = Figures.BASE;
	}

	get isFirstStep() {
		return this.countSteps === 0;
	}

	get isSecondStep() {
		return this.countSteps === 1;
	}

	get isCurrentStep() {
		return this.numStep === this.cell.board.numStep;
	}

	get board() {
		return this.cell.board;
	}

	is(label) {
		return this.label === label;
	}

	getCell(x, y) {
		if (x !== undefined && y !== undefined) {
			return this.cell.getCell(x, y);
		}
		return this.cell;
	}

	canMove(target, isColor = true) {
		if (isColor && this.color === target.figure?.color) {
			return false;
		}
		return true;
	}

	canMoveLegally(target) {
		if (!this.canMove(target)) {
			return false;
		}
		return !this.board.wouldBeInCheckAfterMove(this.cell, target);
	}

	moveToCell(target) {
		this.countSteps++;
		this.numStep = this.cell.board.numStep;
	}
}
