import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import CellComponent from './CellComponent';
import PromotionModal from './PromotionModal';
import GameSettingsPanel from './GameSettingsPanel';
import CapturedFiguresPanel from './CapturedFiguresPanel';
import { HintLevel } from '../models/hints/HintLevels';import {
	getAllCapturersOf,
	hasLegalMoves,
	isCaptureOfTarget,
} from '../models/TouchMove';

function BoardComponent({ board, setBoard, currentPlayer = null, swapPlayer = () => {} }) {
	const [selectedCell, setSelectedCell] = useState(null);
	const [promotion, setPromotion] = useState(null);
	const [hintLevel, setHintLevel] = useState(HintLevel.SPECIAL);
	const [touchMoveEnabled, setTouchMoveEnabled] = useState(false);
	const [touchLockedCell, setTouchLockedCell] = useState(null);
	const [touchCaptureTarget, setTouchCaptureTarget] = useState(null);
	const [touchMessage, setTouchMessage] = useState('');

	function getHintOptions() {
		return {
			captureTarget: touchMoveEnabled ? touchCaptureTarget : null,
			candidateCells:
				touchMoveEnabled && touchCaptureTarget && !touchLockedCell
					? getAllCapturersOf(board, currentPlayer?.color, touchCaptureTarget)
					: null,
		};
	}

	function updateBoard(nextSelected = selectedCell) {
		board.applyHints(nextSelected, hintLevel, currentPlayer?.color, getHintOptions());
		setBoard(board.copy());
	}

	function clearTouchState() {
		setTouchLockedCell(null);
		setTouchCaptureTarget(null);
		setTouchMessage('');
	}

	function finishTurn() {
		swapPlayer();
		setSelectedCell(null);
		clearTouchState();
		updateBoard(null);
	}

	function tryExecuteMove(fromCell, toCell) {
		if (!fromCell.figure?.canMoveLegally(toCell)) {
			return false;
		}

		if (touchMoveEnabled && touchLockedCell && fromCell !== touchLockedCell) {
			setTouchMessage('Нужно ходить зафиксированной фигурой.');
			return true;
		}

		if (touchMoveEnabled && touchCaptureTarget && !isCaptureOfTarget(board, fromCell, toCell, touchCaptureTarget)) {
			setTouchMessage('Нужно взять выбранную фигуру соперника.');
			return true;
		}

		const result = fromCell.moveFigure(toCell);
		if (result.needsPromotion) {
			setPromotion({ cell: result.cell, color: result.cell.figure.color });
			setSelectedCell(null);
			clearTouchState();
			updateBoard(null);
			return true;
		}

		finishTurn();
		return true;
	}

	function lockOwnPiece(cell, captureTarget = null) {
		setTouchLockedCell(cell);
		setTouchCaptureTarget(captureTarget);
		setSelectedCell(cell);
		setTouchMessage('');
		updateBoard(cell);
	}

	function lockCaptureTarget(targetCell) {
		const capturers = getAllCapturersOf(board, currentPlayer.color, targetCell);
		if (capturers.length === 0) {
			setTouchMessage('Эту фигуру взять нельзя — можно сделать любой другой допустимый ход.');
			return;
		}

		setTouchCaptureTarget(targetCell);
		setTouchMessage('');

		if (capturers.length === 1) {
			lockOwnPiece(capturers[0], targetCell);
			return;
		}

		setTouchLockedCell(null);
		setSelectedCell(null);
		updateBoard(null);
	}

	function click(cell) {
		if (promotion) {
			return;
		}

		if (selectedCell && selectedCell !== cell) {
			if (tryExecuteMove(selectedCell, cell)) {
				return;
			}
		}

		if (cell === selectedCell) {
			if (touchMoveEnabled && touchLockedCell) {
				return;
			}
			setSelectedCell(null);
			updateBoard(null);
			return;
		}

		if (touchMoveEnabled && touchLockedCell && !cell.isEmpty() && cell.figure?.color === currentPlayer?.color) {
			if (cell !== touchLockedCell) {
				setTouchMessage('Сначала завершите ход зафиксированной фигурой.');
				return;
			}
			return;
		}

		if (!cell.isEmpty() && cell.figure?.color !== currentPlayer?.color) {
			if (touchMoveEnabled) {
				lockCaptureTarget(cell);
			}
			return;
		}

		if (!cell.isEmpty() && cell.figure?.color === currentPlayer?.color) {
			if (touchMoveEnabled && touchCaptureTarget) {
				const capturers = getAllCapturersOf(board, currentPlayer.color, touchCaptureTarget);
				if (!capturers.includes(cell)) {
					setTouchMessage('Выберите фигуру, которой можно взять цель.');
					return;
				}
				lockOwnPiece(cell, touchCaptureTarget);
				return;
			}

			if (touchMoveEnabled) {
				if (!hasLegalMoves(board, cell)) {
					setTouchMessage('У этой фигуры нет допустимых ходов — выберите другую.');
					return;
				}
				lockOwnPiece(cell);
				return;
			}

			setSelectedCell(cell);
			updateBoard(cell);
		}
	}

	function handlePromotion(figureLabel) {
		board.promotePawn(promotion.cell, figureLabel);
		setPromotion(null);
		finishTurn();
	}

	function handleHintLevelChange(level) {
		setHintLevel(level);
		board.applyHints(selectedCell, level, currentPlayer?.color, getHintOptions());
		setBoard(board.copy());
	}

	function handleTouchMoveToggle(enabled) {
		setTouchMoveEnabled(enabled);
		if (!enabled) {
			clearTouchState();
		}
		setTouchMessage('');
		updateBoard(selectedCell);
	}

	const inCheck = currentPlayer?.color ? board.isInCheck(currentPlayer.color) : false;

	useEffect(() => {
		if (currentPlayer) {
			board.applyHints(selectedCell, hintLevel, currentPlayer.color, getHintOptions());
			setBoard(board.copy());
		}
	}, [currentPlayer?.color]);

	return (
		<>
			<Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>
				Ходит «{currentPlayer?.name}»
				{inCheck && hintLevel >= HintLevel.FULL && (
					<Typography.Text style={{ color: '#fa8c16', fontSize: 18 }}>
						{' '}
						— шах!
					</Typography.Text>
				)}
			</Typography.Title>
			<div className="game-layout">
				<aside className="game-sidebar game-sidebar--left">
					<GameSettingsPanel
						hintLevel={hintLevel}
						onHintLevelChange={handleHintLevelChange}
						touchMoveEnabled={touchMoveEnabled}
						onTouchMoveChange={handleTouchMoveToggle}
						touchLockedCell={touchLockedCell}
						touchCaptureTarget={touchCaptureTarget}
						touchMessage={touchMessage}
					/>
				</aside>

				<div className="game-board">
					<div className="board__container">
						<div className="board__row">
							<div className="board__legend board__legend--h board__legend--w"></div>
							{['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((i) => (
								<div key={i} className="board__legend board__legend--h">
									{i}
								</div>
							))}
							<div className="board__legend board__legend--h board__legend--w"></div>
						</div>
						<div className="board__row">
							<div className="board__column">
								{[8, 7, 6, 5, 4, 3, 2, 1].map((i) => (
									<div key={i} className="board__legend board__legend--w">
										{i}
									</div>
								))}
							</div>
							<div className="board">
								{board.cells.map((row, index) => (
									<React.Fragment key={index}>
										{row.map((cell) => (
											<CellComponent
												onClick={click}
												selected={
													selectedCell?.x === cell.x && selectedCell?.y === cell.y
												}
												locked={
													touchMoveEnabled &&
													touchLockedCell?.x === cell.x &&
													touchLockedCell?.y === cell.y
												}
												cell={cell}
												key={cell.key}
											/>
										))}
									</React.Fragment>
								))}
							</div>
							<div className="board__column">
								{[8, 7, 6, 5, 4, 3, 2, 1].map((i) => (
									<div key={i} className="board__legend board__legend--w">
										{i}
									</div>
								))}
							</div>
						</div>
						<div className="board__row">
							<div className="board__legend board__legend--h board__legend--w"></div>
							{['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((i) => (
								<div key={i} className="board__legend board__legend--h">
									{i}
								</div>
							))}
							<div className="board__legend board__legend--h board__legend--w"></div>
						</div>
					</div>
				</div>

				<aside className="game-sidebar game-sidebar--right">
					<CapturedFiguresPanel
						lostWhiteFigures={board.lostWhiteFigures}
						lostBlackFigures={board.lostBlackFigures}
					/>
				</aside>
			</div>
			{promotion && (
				<PromotionModal color={promotion.color} onSelect={handlePromotion} />
			)}
		</>
	);
}

export default BoardComponent;
