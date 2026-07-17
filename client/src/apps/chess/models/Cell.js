import { Colors } from './Colors';
import { Figures } from './figure/Base';
import { createEnPassant, isDoublePawnMove, getEnPassantVictimCell } from './EnPassant';
import { getMoveHintType } from './hints/MoveHint';

const EMPTY_HINTS = () => ({
	move: false,
	capture: false,
	double: false,
	enPassant: false,
	enPassantVictim: false,
	castling: false,
	promotion: false,
	lastMove: false,
	check: false,
	pawnAttack: false,
	attacked: false,
});

export class Cell {
	x = null;
	y = null;
	figure = null;
	color = null;
	board = null;
	key = null;
	_hints = EMPTY_HINTS();
	_rec = false;

	constructor(board, x, y, color, figure = null) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.board = board;
		this.figure = figure;
		this._hints = EMPTY_HINTS();
		this._rec = false;
		this.key = `${x}-${y}`;
	}

	get hints() {
		return this._hints;
	}

	hasHint(type) {
		return !!this._hints[type];
	}

	get available() {
		return (
			this._hints.move ||
			this._hints.double ||
			this._hints.castling ||
			this._hints.promotion ||
			this._hints.enPassant
		);
	}

	get attack() {
		return this._hints.capture || this._hints.enPassant;
	}

	get inCheck() {
		return this._hints.check;
	}

	clearHints() {
		this._hints = EMPTY_HINTS();
	}

	setHint(type, value = true) {
		if (type) {
			this._hints[type] = value;
		}
	}

	getCell(x, y) {
		return this.board.getCell(x, y);
	}

	setFigure(figure) {
		this.figure = figure;
		if (figure) {
			this.figure.cell = this;
		}
	}

	moveFigure(target) {
		if (!this.figure?.canMoveLegally(target)) {
			return { success: false };
		}

		const figure = this.figure;
		const fromX = this.x;
		const fromY = this.y;
		const hintType = getMoveHintType(this, target);
		const isDoublePawn = isDoublePawnMove(figure, fromX, fromY, target.x, target.y);
		const isEnPassant = hintType === 'enPassant';
		const enPassantSnapshot = isEnPassant ? this.board.enPassant : null;

		this.board.enPassant = null;
		this.board.numStep++;

		figure.moveToCell(target);

		if (isEnPassant && enPassantSnapshot) {
			const capturedCell = getEnPassantVictimCell(this.board, enPassantSnapshot);
			if (capturedCell?.figure) {
				this.board.addLostFigure(capturedCell.figure);
				capturedCell.figure = null;
			}
		} else if (target.figure) {
			this.board.addLostFigure(target.figure);
		}

		if (figure.is(Figures.KING) && Math.abs(target.y - fromY) === 2) {
			const row = fromX;
			if (target.y < fromY) {
				this.board.applyCastlingRook(
					this.board.getCell(row, 0),
					this.board.getCell(row, target.y + 1),
				);
			} else {
				this.board.applyCastlingRook(
					this.board.getCell(row, 7),
					this.board.getCell(row, target.y - 1),
				);
			}
		}

		target.setFigure(figure);
		this.figure = null;

		if (isDoublePawn) {
			this.board.enPassant = createEnPassant(fromX, fromY, target.x, figure.color);
		}

		this.board.lastMove = {
			from: { x: fromX, y: fromY },
			to: { x: target.x, y: target.y },
			hintType,
			isEnPassant,
		};

		const needsPromotion =
			figure.is(Figures.PAWN) &&
			((figure.color === Colors.WHITE && target.x === 0) ||
				(figure.color === Colors.BLACK && target.x === 7));

		return { success: true, needsPromotion, cell: target };
	}

	is(label) {
		return this.figure?.is(label);
	}

	isEmpty() {
		return this.figure === null;
	}

	isEnemy(target) {
		if (target.figure) {
			return this.figure?.color !== target.figure.color;
		}
		return false;
	}

	underAttack(color) {
		if (this._rec) {
			return false;
		}
		this._rec = true;

		for (let i = 0; i < 8; i++) {
			const cell = this.getCell(i, this.y);
			if (
				cell.figure?.canMove(this, false) &&
				cell.figure.color === color &&
				!cell.figure.is(Figures.PAWN)
			) {
				this._rec = false;
				return true;
			}
		}

		for (let i = 0; i < 8; i++) {
			const cell = this.getCell(this.x, i);
			if (
				cell.figure?.canMove(this, false) &&
				cell.figure.color === color &&
				!cell.figure.is(Figures.PAWN)
			) {
				this._rec = false;
				return true;
			}
		}

		let x = this.x;
		let y = this.y;
		while (x > 0 && y > 0) {
			x--;
			y--;
		}
		let s = 8 - Math.max(x, y);
		for (let i = 0; i < s; i++) {
			const cell = this.getCell(x + i, y + i);
			if (
				cell.figure?.canMove(this, false) &&
				cell.figure.color === color &&
				!cell.figure.is(Figures.PAWN)
			) {
				this._rec = false;
				return true;
			}
		}

		x = this.x;
		y = this.y;
		while (x < 7 && y > 0) {
			x++;
			y--;
		}
		s = Math.max(x, y) - Math.min(x, y) + 1;
		for (let i = 0; i < s; i++) {
			const cell = this.getCell(x - i, y + i);
			if (
				cell.figure?.canMove(this, false) &&
				cell.figure.color === color &&
				!cell.figure.is(Figures.PAWN)
			) {
				this._rec = false;
				return true;
			}
		}

		const direct = color === Colors.BLACK ? -1 : 1;
		if (
			this.y < 7 &&
			this.getCell(this.x + direct, this.y + 1).figure?.is(Figures.PAWN) &&
			this.getCell(this.x + direct, this.y + 1).figure?.color === color
		) {
			this._rec = false;
			return true;
		}
		if (
			this.y > 0 &&
			this.getCell(this.x + direct, this.y - 1).figure?.is(Figures.PAWN) &&
			this.getCell(this.x + direct, this.y - 1).figure?.color === color
		) {
			this._rec = false;
			return true;
		}

		const steps = [
			[2, 1],
			[2, -1],
			[-2, 1],
			[-2, -1],
			[1, 2],
			[1, -2],
			[-1, 2],
			[-1, -2],
		];
		for (const [dx, dy] of steps) {
			const nx = this.x + dx;
			const ny = this.y + dy;
			if (nx > 7 || nx < 0 || ny > 7 || ny < 0) {
				continue;
			}
			const cell = this.getCell(nx, ny);
			if (
				cell.figure?.canMove(this, false) &&
				cell.figure.color === color &&
				cell.figure.is(Figures.KNIGHT)
			) {
				this._rec = false;
				return true;
			}
		}

		this._rec = false;
		return false;
	}

	emptyV(target) {
		if (this.y !== target.y) {
			return false;
		}
		const min = Math.min(this.x, target.x);
		const max = Math.max(this.x, target.x);
		for (let i = min + 1; i <= max - 1; i++) {
			if (!this.board.cells[i][this.y].isEmpty()) {
				return false;
			}
		}
		return true;
	}

	emptyH(target) {
		if (this.x !== target.x) {
			return false;
		}
		const min = Math.min(this.y, target.y);
		const max = Math.max(this.y, target.y);
		for (let i = min + 1; i <= max - 1; i++) {
			if (!this.board.cells[this.x][i].isEmpty()) {
				return false;
			}
		}
		return true;
	}

	emptyD(target) {
		const ax = Math.abs(this.x - target.x);
		const ay = Math.abs(this.y - target.y);
		if (ax !== ay) {
			return false;
		}
		const dx = this.x < target.x ? 1 : -1;
		const dy = this.y < target.y ? 1 : -1;
		for (let i = 1; i < ax; i++) {
			const x = this.x + dx * i;
			const y = this.y + dy * i;
			if (!this.board.cells[x][y].isEmpty()) {
				return false;
			}
		}
		return true;
	}
}
