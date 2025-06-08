import store from "../store";

export function Field() {
	const { isEnd, player, field, setPlayer, setField } = store();
	const handleClickField = (i) => {
		if (isEnd || field[i]) {
			return;
		}
		let newField = field.slice();
		newField[i] = player;
		setField(newField);
		setPlayer(player === "X" ? "O" : "X");
	};
	return (
		<div className="tic-tac-toe__board">
			{field.map((cell, index) => {
				return (
					<button
						className="tic-tac-toe__btn"
						key={index}
						onClick={() => handleClickField(index)}
					>
						{cell}
					</button>
				);
			})}
		</div>
	);
}
