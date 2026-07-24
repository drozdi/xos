import { useEffect, useState } from 'react';

import BoardComponent from './components/BoardComponent.jsx';
import { ChessGame } from './models/ChessGame.js';
import { Colors } from './models/Colors.js';
import { Player } from './models/Player.js';
import { useChessStore } from './chessStore';

import './theme/variables.css';
import './chess.css';

function createGame() {
	const game = new ChessGame();
	game.generateCells();
	game.generateFigures();
	return game;
}

export default function ChessApp() {
	const restartKey = useChessStore((state) => state.restartKey);
	const [board, setBoard] = useState(createGame);
	const [whitePlayer] = useState(() => new Player(Colors.WHITE, 'Белый'));
	const [blackPlayer] = useState(() => new Player(Colors.BLACK, 'Черный'));
	const [currentPlayer, setCurrentPlayer] = useState<InstanceType<typeof Player> | null>(null);

	useEffect(() => {
		const game = createGame();
		setBoard(game);
		setCurrentPlayer(whitePlayer);
	}, [restartKey, whitePlayer]);

	function swapPlayer() {
		setCurrentPlayer((player) => {
			if (!player || player.color === Colors.WHITE) {
				return blackPlayer;
			}
			return whitePlayer;
		});
	}

	return (
		<div className="chess-app" style={{ height: '100%', overflow: 'auto' }}>
			<BoardComponent
				currentPlayer={currentPlayer as never}
				swapPlayer={swapPlayer}
				board={board}
				setBoard={setBoard}
			/>
		</div>
	);
}
