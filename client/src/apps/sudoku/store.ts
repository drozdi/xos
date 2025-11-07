import { create } from 'zustand';

export default create((set, get) => ({
	size: 9,
	cells: new Array(9).fill(0).map(() => new Array(9).fill(0)),
	value: '1',
	mod: 'pen',
	setValue: (value: string) => {
		set({
			...get(),
			value: String(value),
		});
	},
	setMod: (mod: string) => {
		set({
			...get(),
			mod,
		});
	},
	set: (i: number, j: number, val: number) => {
		i--;
		j--;
		const { cells } = get();
		cells[i][j] = val;
		set({
			...get(),
			cells,
		});
	},
}));
