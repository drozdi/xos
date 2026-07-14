import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

const AREA_LETTERS = {
	h: 'header',
	f: 'footer',
	l: 'left',
	r: 'right',
	m: 'main',
} as const;

type AreaLetter = keyof typeof AREA_LETTERS;
type AreaName = (typeof AREA_LETTERS)[AreaLetter];

export interface AreaRect {
	row: number;
	col: number;
	rowSpan: number;
	colSpan: number;
}

export interface ParsedLayout {
	columns: number;
	rows: number;
	templateAreas: string;
	templateColumns: string;
	templateRows: string;
	areas: Record<string, AreaRect>;
}

export interface PanelWidths {
	left?: number;
	right?: number;
}

export const AREA_ID_TO_NAME: Record<AreaLetter, AreaName> = AREA_LETTERS;

function letterToAreaName(letter: string): AreaName {
	const name = AREA_LETTERS[letter as AreaLetter];
	if (!name) {
		throw new Error(`Unknown layout area letter: "${letter}"`);
	}
	return name;
}

function buildGrid(view: string): { grid: AreaName[][]; columns: number; rows: number } {
	const rawRows = view.trim().split(/\s+/).filter(Boolean);
	if (rawRows.length === 0) {
		throw new Error('Layout view must contain at least one row');
	}

	const columns = Math.max(...rawRows.map((row) => row.length));
	const grid = rawRows.map((row) => {
		const cells: AreaName[] = [];
		for (const letter of row) {
			cells.push(letterToAreaName(letter.toLowerCase()));
		}
		while (cells.length < columns) {
			cells.push('main');
		}
		return cells;
	});

	return { grid, columns, rows: grid.length };
}

function buildTemplateAreas(grid: AreaName[][]): string {
	return grid
		.map((row) => `"${row.join(' ')}"`)
		.join('\n');
}

function buildAreas(grid: AreaName[][]): Record<string, AreaRect> {
	const areas: Record<string, AreaRect> = {};

	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid[row]!.length; col++) {
			const name = grid[row]![col]!;
			const current = areas[name];

			if (!current) {
				areas[name] = { row, col, rowSpan: 1, colSpan: 1 };
				continue;
			}

			const minRow = Math.min(current.row, row);
			const minCol = Math.min(current.col, col);
			const maxRow = Math.max(current.row + current.rowSpan - 1, row);
			const maxCol = Math.max(current.col + current.colSpan - 1, col);

			areas[name] = {
				row: minRow,
				col: minCol,
				rowSpan: maxRow - minRow + 1,
				colSpan: maxCol - minCol + 1,
			};
		}
	}

	return areas;
}

function buildTemplateColumns(
	grid: AreaName[][],
	columns: number,
	panelWidths: PanelWidths,
): string {
	const leftWidth = panelWidths.left ?? HKEY_CONFIG_DEFAULTS.layout.panels.left.width;
	const rightWidth = panelWidths.right ?? HKEY_CONFIG_DEFAULTS.layout.panels.right.width;
	const sizes: string[] = [];

	for (let col = 0; col < columns; col++) {
		let hasLeft = false;
		let hasRight = false;

		for (const row of grid) {
			const cell = row[col];
			if (cell === 'left') {hasLeft = true;}
			if (cell === 'right') {hasRight = true;}
		}

		if (hasLeft && !hasRight) {
			sizes.push(`${leftWidth}px`);
		} else if (hasRight && !hasLeft) {
			sizes.push(`${rightWidth}px`);
		} else if (hasLeft && hasRight) {
			sizes.push(`${Math.max(leftWidth, rightWidth)}px`);
		} else {
			sizes.push('1fr');
		}
	}

	return sizes.join(' ');
}

function buildTemplateRows(grid: AreaName[][]): string {
	const taskbarHeight = HKEY_CONFIG_DEFAULTS.taskbar.height;
	const sizes: string[] = [];

	for (const row of grid) {
		const hasMain = row.includes('main');
		const hasFooter = row.includes('footer');

		if (hasMain) {
			sizes.push('1fr');
		} else if (hasFooter) {
			sizes.push(`${taskbarHeight}px`);
		} else {
			sizes.push('auto');
		}
	}

	return sizes.join(' ');
}

export function parseView(view: string, panelWidths: PanelWidths = {}): ParsedLayout {
	const { grid, columns, rows } = buildGrid(view);

	return {
		columns,
		rows,
		templateAreas: buildTemplateAreas(grid),
		templateColumns: buildTemplateColumns(grid, columns, panelWidths),
		templateRows: buildTemplateRows(grid),
		areas: buildAreas(grid),
	};
}
