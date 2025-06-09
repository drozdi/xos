import { create } from "zustand";

export default create((set, get) => ({
	isEnd: false,
	player: "X",
	isDraw: false,
	field: Array(9).fill(""),
	setField(field) {
		set({
			...get(),
			field,
		});
	},
	setPlayer(player) {
		set({
			...get(),
			player,
		});
	},
	draw() {
		set({
			...get(),
			isDraw: true,
		});
	},
	endGame() {
		set({
			...get(),
			isEnd: true,
		});
	},
	restart() {
		set({
			field: Array(9).fill(""),
			isDraw: false,
			isEnd: false,
			player: "X",
		});
	},
}));
