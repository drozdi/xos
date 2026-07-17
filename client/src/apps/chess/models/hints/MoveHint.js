import { Colors } from '../Colors';
import { Figures } from '../figure/Base';
import { canCaptureEnPassant } from '../EnPassant';

export function getMoveHintType(fromCell, toCell) {
	const figure = fromCell.figure;
	if (!figure) {
		return null;
	}

	if (figure.is(Figures.PAWN)) {
		return getPawnHintType(figure, fromCell, toCell);
	}

	if (figure.is(Figures.KING) && Math.abs(toCell.y - fromCell.y) === 2 && fromCell.x === toCell.x) {
		return 'castling';
	}

	return toCell.figure ? 'capture' : 'move';
}

function getPawnHintType(figure, fromCell, toCell) {
	const direct = figure.color === Colors.BLACK ? 1 : -1;
	const firstDirect = figure.color === Colors.BLACK ? 2 : -2;
	const promotionRank = figure.color === Colors.WHITE ? 0 : 7;

	if (canCaptureEnPassant(figure, fromCell, toCell, figure.board.enPassant)) {
		return 'enPassant';
	}

	if (
		toCell.x === fromCell.x + direct &&
		Math.abs(toCell.y - fromCell.y) === 1 &&
		fromCell.isEnemy(toCell)
	) {
		return toCell.x === promotionRank ? 'promotion' : 'capture';
	}

	if (
		figure.isFirstStep &&
		toCell.x === fromCell.x + firstDirect &&
		toCell.y === fromCell.y &&
		toCell.isEmpty() &&
		figure.board.getCell(fromCell.x + direct, fromCell.y).isEmpty()
	) {
		return 'double';
	}

	if (
		toCell.x === fromCell.x + direct &&
		toCell.y === fromCell.y &&
		toCell.isEmpty()
	) {
		return toCell.x === promotionRank ? 'promotion' : 'move';
	}

	return null;
}

export function getEnPassantCapturedCell(fromCell, toCell, enPassant) {
	if (!canCaptureEnPassant(fromCell.figure, fromCell, toCell, enPassant)) {
		return null;
	}
	return fromCell.board.getCell(enPassant.capture.x, enPassant.capture.y);
}
