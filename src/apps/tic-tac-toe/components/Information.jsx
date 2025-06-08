import { Box } from "../../../shared/internal/box";
import store from "../store";

export function Information() {
	const { player, isEnd, isDraw } = store();
	let message = `Ходит: ${player}`;
	if (isDraw) {
		message = "Ничья";
	} else if (isEnd) {
		message = `Выиграл: ${player}`;
	}
	return (
		<Box.Header lavel={3} className="text-2xl">
			{message}
		</Box.Header>
	);
}
