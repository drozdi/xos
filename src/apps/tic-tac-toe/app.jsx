import { Window } from "../../features";
import { useApp } from "../../features/app";
import { Box } from "../../shared/internal/box";
import { XBtn } from "../../shared/ui";
import { Field, Information } from "./components";
import store from "./store";
import "./style.css";

const WIN_COMBINATIONS = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[6, 4, 2],
];

export function AppTicTacToe() {
	const { isEnd, field, setPlayer, draw, endGame, restart } = store();
	const $app = useApp();
	$app.on("reload", () => restart());
	const checkWinner = () => {
		if (isEnd) {
			return;
		}
		let win = false;
		for (let combination of WIN_COMBINATIONS) {
			let [a, b, c] = combination;
			if (field[a] && field[a] === field[b] && field[b] === field[c]) {
				win = true;
				endGame();
				setPlayer(field[a]);
			}
		}
		if (!win && field.every((cell) => cell !== "")) {
			draw();
		}
	};

	checkWinner();

	return (
		<Window title="Крестик Нолик" draggable icons="reload collapse close">
			<Box col className="tic-tao-toe">
				<Box.Section row side className="text-2xl">
					<Box.Section>
						<Information />
					</Box.Section>
					<Box.Section side>
						<XBtn
							size="sm"
							disabled={!isEnd}
							leftSection="mdi-reload"
							color="info"
							onClick={() => restart()}
						/>
					</Box.Section>
				</Box.Section>
				<Box.Section>
					<Field />
				</Box.Section>
			</Box>
		</Window>
	);
}

AppTicTacToe.displayName = "apps/tic-tac-toe/app";

export default AppTicTacToe;
