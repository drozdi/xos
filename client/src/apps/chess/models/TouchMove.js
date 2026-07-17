import { isEnPassantMove, getEnPassantVictimCell } from './EnPassant';

export function getLegalTargetsFrom(board, fromCell) {
	const targets = [];
	for (const row of board.cells) {
		for (const target of row) {
			if (fromCell.figure?.canMoveLegally(target)) {
				targets.push(target);
			}
		}
	}
	return targets;
}

export function hasLegalMoves(board, fromCell) {
	return getLegalTargetsFrom(board, fromCell).length > 0;
}

export function getCapturersOf(board, attackerColor, targetCell) {
	const capturers = [];
	for (const row of board.cells) {
		for (const cell of row) {
			if (cell.figure?.color !== attackerColor) {
				continue;
			}
			if (cell.figure.canMoveLegally(targetCell)) {
				capturers.push(cell);
			}
		}
	}
	return capturers;
}

export function getEnPassantCapturersOf(board, attackerColor, victimCell) {
	if (!board.enPassant || getEnPassantVictimCell(board, board.enPassant) !== victimCell) {
		return [];
	}

	const epTarget = board.getCell(board.enPassant.to.x, board.enPassant.to.y);
	const capturers = [];

	for (const row of board.cells) {
		for (const cell of row) {
			if (cell.figure?.color === attackerColor && cell.figure.canMoveLegally(epTarget)) {
				capturers.push(cell);
			}
		}
	}

	return capturers;
}

export function getAllCapturersOf(board, attackerColor, targetCell) {
	const direct = getCapturersOf(board, attackerColor, targetCell);
	const enPassant = getEnPassantCapturersOf(board, attackerColor, targetCell);
	const seen = new Set();
	return [...direct, ...enPassant].filter((cell) => {
		const key = cell.key;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

export function isCaptureOfTarget(board, fromCell, toCell, captureTarget) {
	if (!captureTarget) {
		return true;
	}
	if (toCell === captureTarget) {
		return true;
	}
	if (isEnPassantMove(fromCell, toCell, board.enPassant)) {
		return getEnPassantVictimCell(board, board.enPassant) === captureTarget;
	}
	return false;
}

export function filterTargetsForCapture(board, fromCell, captureTarget) {
	return getLegalTargetsFrom(board, fromCell).filter((target) =>
		isCaptureOfTarget(board, fromCell, target, captureTarget),
	);
}
