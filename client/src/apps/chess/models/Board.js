import { Cell } from './Cell';
import { Colors } from './Colors';
import { Figures } from './figure/Base';
import { Queen } from './figure/Queen';
import { Rook } from './figure/Rook';
import { Bishop } from './figure/Bishop';
import { Knight } from './figure/Knight';
import { HintLevel, normalizeHintType } from './hints/HintLevels';
import { getMoveHintType, getEnPassantCapturedCell } from './hints/MoveHint';
import { isEnPassantMove } from './EnPassant';
import { isCaptureOfTarget } from './TouchMove';

const PROMOTION_PIECES = {
	[Figures.QUEEN]: Queen,
	[Figures.ROOK]: Rook,
	[Figures.BISHOP]: Bishop,
	[Figures.KNIGHT]: Knight,
};

export class Board {
	numStep = 0;
	cells = [];
	lostBlackFigures = [];
	lostWhiteFigures = [];
	enPassant = null;
	lastMove = null;

	getCell(x, y) {
		return this.cells[x][y];
	}

	generateCells() {
		for (let i = 0; i < 8; i++) {
			const row = [];
			for (let j = 0; j < 8; j++) {
				if ((i + j) % 2 === 0) {
					row.push(new Cell(this, i, j, Colors.WHITE));
				} else {
					row.push(new Cell(this, i, j, Colors.BLACK));
				}
			}
			this.cells.push(row);
		}
	}

	copy() {
		const newBoard = new Board();
		newBoard.cells = this.cells;
		newBoard.lostBlackFigures = this.lostBlackFigures;
		newBoard.lostWhiteFigures = this.lostWhiteFigures;
		newBoard.numStep = this.numStep;
		newBoard.enPassant = this.enPassant;
		newBoard.lastMove = this.lastMove;
		return newBoard;
	}

	clearHints() {
		for (const row of this.cells) {
			for (const cell of row) {
				cell.clearHints();
			}
		}
	}

	applyHints(selectedCell, hintLevel, currentPlayerColor, options = {}) {
		this.clearHints();

		const { captureTarget = null, candidateCells = null } = options;

		if (candidateCells?.length) {
			for (const cell of candidateCells) {
				cell.setHint('move');
			}
		}

		if (hintLevel === HintLevel.NONE) {
			return;
		}

		if (selectedCell?.figure) {
			this.lightMoveHints(selectedCell, hintLevel, { captureTarget });
		}

		if (hintLevel >= HintLevel.SPECIAL) {
			this.markLastMove();
			this.markEnPassantOpportunity();
		}

		if (hintLevel >= HintLevel.FULL) {
			this.markChecks();
			if (currentPlayerColor) {
				this.markAttackedPieces(currentPlayerColor);
				this.markPawnAttacks(currentPlayerColor);
			}
		}
	}

	lightMoveHints(selectedCell, hintLevel, options = {}) {
		const { captureTarget = null } = options;

		for (const row of this.cells) {
			for (const target of row) {
				if (!selectedCell.figure.canMoveLegally(target)) {
					continue;
				}

				if (captureTarget && !isCaptureOfTarget(this, selectedCell, target, captureTarget)) {
					continue;
				}

				const rawType = getMoveHintType(selectedCell, target);
				const hintType = normalizeHintType(rawType, hintLevel);
				target.setHint(hintType);

				if (rawType === 'enPassant' && hintLevel >= HintLevel.SPECIAL) {
					const victim = getEnPassantCapturedCell(selectedCell, target, this.enPassant);
					victim?.setHint('enPassantVictim');
				}
			}
		}
	}

	markLastMove() {
		if (!this.lastMove) {
			return;
		}
		this.getCell(this.lastMove.from.x, this.lastMove.from.y)?.setHint('lastMove');
		this.getCell(this.lastMove.to.x, this.lastMove.to.y)?.setHint('lastMove');
	}

	markEnPassantOpportunity() {
		if (!this.enPassant) {
			return;
		}
		this.getCell(this.enPassant.to.x, this.enPassant.to.y)?.setHint('enPassant');
		this.getCell(this.enPassant.capture.x, this.enPassant.capture.y)?.setHint('enPassantVictim');
	}

	markChecks() {
		for (const color of [Colors.WHITE, Colors.BLACK]) {
			if (this.isInCheck(color)) {
				this.findKingCell(color)?.setHint('check');
			}
		}
	}

	markAttackedPieces(defenderColor) {
		const attackerColor = defenderColor === Colors.WHITE ? Colors.BLACK : Colors.WHITE;
		for (const row of this.cells) {
			for (const cell of row) {
				if (cell.figure?.color === defenderColor && cell.underAttack(attackerColor)) {
					cell.setHint('attacked');
				}
			}
		}
	}

	markPawnAttacks(defenderColor) {
		const attackerColor = defenderColor === Colors.WHITE ? Colors.BLACK : Colors.WHITE;
		const direct = attackerColor === Colors.BLACK ? 1 : -1;

		for (const row of this.cells) {
			for (const cell of row) {
				if (!cell.figure?.is(Figures.PAWN) || cell.figure.color !== attackerColor) {
					continue;
				}
				for (const dy of [-1, 1]) {
					const nx = cell.x + direct;
					const ny = cell.y + dy;
					if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
						this.getCell(nx, ny)?.setHint('pawnAttack');
					}
				}
			}
		}
	}

	findKingCell(color) {
		for (const row of this.cells) {
			for (const cell of row) {
				if (cell.figure?.is(Figures.KING) && cell.figure.color === color) {
					return cell;
				}
			}
		}
		return null;
	}

	isInCheck(color) {
		const kingCell = this.findKingCell(color);
		if (!kingCell) {
			return false;
		}
		const enemy = color === Colors.WHITE ? Colors.BLACK : Colors.WHITE;
		return kingCell.underAttack(enemy);
	}

	takeSnapshot() {
		return this.cells.map((row) => row.map((cell) => cell.figure));
	}

	restoreSnapshot(snapshot) {
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				this.cells[i][j].figure = snapshot[i][j];
				if (snapshot[i][j]) {
					snapshot[i][j].cell = this.cells[i][j];
				}
			}
		}
	}

	applyCastlingRook(fromCell, toCell) {
		const rook = fromCell.figure;
		fromCell.figure = null;
		toCell.figure = rook;
		rook.cell = toCell;
	}

	applyMove(fromCell, toCell) {
		const figure = fromCell.figure;
		if (!figure) {
			return;
		}

		if (isEnPassantMove(fromCell, toCell, this.enPassant)) {
			const capturedCell = getEnPassantCapturedCell(fromCell, toCell, this.enPassant);
			if (capturedCell?.figure) {
				capturedCell.figure = null;
			}
		} else if (toCell.figure) {
			toCell.figure = null;
		}

		if (figure.is(Figures.KING) && Math.abs(toCell.y - fromCell.y) === 2) {
			const row = fromCell.x;
			if (toCell.y < fromCell.y) {
				this.applyCastlingRook(this.getCell(row, 0), this.getCell(row, toCell.y + 1));
			} else {
				this.applyCastlingRook(this.getCell(row, 7), this.getCell(row, toCell.y - 1));
			}
		}

		fromCell.figure = null;
		toCell.figure = figure;
		figure.cell = toCell;
	}

	wouldBeInCheckAfterMove(fromCell, toCell) {
		const color = fromCell.figure.color;
		const snapshot = this.takeSnapshot();
		this.applyMove(fromCell, toCell);
		const inCheck = this.isInCheck(color);
		this.restoreSnapshot(snapshot);
		return inCheck;
	}

	addLostFigure(figure) {
		if (figure.color === Colors.WHITE) {
			this.lostWhiteFigures.push(figure);
		} else {
			this.lostBlackFigures.push(figure);
		}
	}

	promotePawn(cell, figureLabel) {
		const FigureClass = PROMOTION_PIECES[figureLabel];
		if (!cell.figure?.is(Figures.PAWN) || !FigureClass) {
			return;
		}
		const color = cell.figure.color;
		cell.figure = null;
		new FigureClass(color, cell);
	}
}
