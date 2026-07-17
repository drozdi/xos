import { Base, Figures } from './Base.js';
import { Colors } from '../Colors.js';
import { canCaptureEnPassant } from '../EnPassant.js';
import blackImg from '../../assets/chess/bP.png';
import whiteImg from '../../assets/chess/wP.png';

export class Pawn extends Base {
	constructor(color, cell) {
		super(color, cell);
		this.label = Figures.PAWN;
		this.img = color === Colors.BLACK ? blackImg : whiteImg;
	}

	canMove(target, isColor = true) {
		if (!super.canMove(target, isColor)) {
			return false;
		}

		const direct = this.color === Colors.BLACK ? 1 : -1;
		const firstDirect = this.color === Colors.BLACK ? 2 : -2;

		if (
			target.x === this.cell.x + direct &&
			target.y === this.cell.y &&
			this.cell.board.cells[target.x][target.y].isEmpty()
		) {
			return true;
		}

		if (
			this.isFirstStep &&
			target.x === this.cell.x + firstDirect &&
			target.y === this.cell.y &&
			this.cell.board.cells[target.x][target.y].isEmpty() &&
			this.cell.board.cells[target.x - direct][target.y].isEmpty()
		) {
			return true;
		}

		if (
			target.x === this.cell.x + direct &&
			Math.abs(target.y - this.cell.y) === 1 &&
			this.cell.isEnemy(target)
		) {
			return true;
		}

		if (canCaptureEnPassant(this, this.cell, target, this.board.enPassant)) {
			return true;
		}

		return false;
	}
}
