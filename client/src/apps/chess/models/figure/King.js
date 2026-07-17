import { Base, Figures } from './Base.js';
import { Colors } from '../Colors.js';
import blackImg from '../../assets/chess/bK.png';
import whiteImg from '../../assets/chess/wK.png';

export class King extends Base {
	constructor(color, cell) {
		super(color, cell);
		this.label = Figures.KING;
		this.img = color === Colors.BLACK ? blackImg : whiteImg;
	}

	canMove(target, isColor = true) {
		if (!super.canMove(target, isColor)) {
			return false;
		}

		const dx = Math.abs(target.x - this.cell.x);
		const dy = Math.abs(target.y - this.cell.y);
		const enemyColor = this.color === Colors.BLACK ? Colors.WHITE : Colors.BLACK;

		if (
			(dx === 1 && dy === 0) ||
			(dx === 0 && dy === 1) ||
			(dx === 1 && dy === 1)
		) {
			return !target.underAttack(enemyColor);
		}

		if (this.isFirstStep && dx === 0 && dy === 2) {
			if (this.cell.underAttack(enemyColor)) {
				return false;
			}

			const direct = target.y - this.cell.y;
			const passCell = this.cell.getCell(this.cell.x, this.cell.y + (direct < 0 ? -1 : 1));
			if (passCell.underAttack(enemyColor)) {
				return false;
			}

			if (direct < 0) {
				const rook = this.cell.board.cells[this.cell.x][0]?.figure;
				if (!rook?.is(Figures.ROOK) || !rook.isFirstStep) {
					return false;
				}
				for (let i = 1; i < this.cell.y; i++) {
					if (!this.cell.board.cells[this.cell.x][i].isEmpty()) {
						return false;
					}
				}
			} else if (direct > 0) {
				const rook = this.cell.board.cells[this.cell.x][7]?.figure;
				if (!rook?.is(Figures.ROOK) || !rook.isFirstStep) {
					return false;
				}
				for (let i = this.cell.y + 1; i < 7; i++) {
					if (!this.cell.board.cells[this.cell.x][i].isEmpty()) {
						return false;
					}
				}
			} else {
				return false;
			}

			return true;
		}

		return false;
	}
}
