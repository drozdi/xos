import { Colors } from './Colors';
import { Figures } from './figure/Base';

/**
 * Состояние возможного взятия на проходе.
 * to — клетка, на которую встаёт берущая пешка (пересечённая соперником).
 * capture — клетка, где стоит пешка соперника (снимается с доски).
 */
export function createEnPassant(fromX, fromY, toX, pawnColor) {
	const direct = pawnColor === Colors.BLACK ? 1 : -1;
	return {
		to: { x: fromX + direct, y: fromY },
		capture: { x: toX, y: fromY },
	};
}

export function isDoublePawnMove(figure, fromX, fromY, toX, toY) {
	return (
		figure?.is(Figures.PAWN) &&
		figure.isFirstStep &&
		Math.abs(toX - fromX) === 2 &&
		fromY === toY
	);
}

export function canCaptureEnPassant(pawn, fromCell, targetCell, enPassant) {
	if (!enPassant || !pawn?.is(Figures.PAWN)) {
		return false;
	}

	if (targetCell.x !== enPassant.to.x || targetCell.y !== enPassant.to.y) {
		return false;
	}

	if (!targetCell.isEmpty()) {
		return false;
	}

	if (fromCell.x !== enPassant.capture.x) {
		return false;
	}

	if (Math.abs(fromCell.y - enPassant.capture.y) !== 1) {
		return false;
	}

	const direct = pawn.color === Colors.BLACK ? 1 : -1;
	if (fromCell.x + direct !== enPassant.to.x) {
		return false;
	}

	const victimCell = fromCell.board.getCell(enPassant.capture.x, enPassant.capture.y);
	return victimCell?.figure?.is(Figures.PAWN) && fromCell.isEnemy(victimCell);
}

export function getEnPassantVictimCell(board, enPassant) {
	if (!enPassant) {
		return null;
	}
	return board.getCell(enPassant.capture.x, enPassant.capture.y);
}

export function isEnPassantMove(fromCell, targetCell, enPassant) {
	return canCaptureEnPassant(fromCell.figure, fromCell, targetCell, enPassant);
}
