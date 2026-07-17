export const HintLevel = {
	NONE: 0,
	BASIC: 1,
	SPECIAL: 2,
	FULL: 3,
};

export const HINT_LEVELS = [
	{
		id: HintLevel.NONE,
		name: 'Без подсказок',
		description: 'Подсказки отключены. Вы играете самостоятельно, без подсветки ходов.',
	},
	{
		id: HintLevel.BASIC,
		name: 'Базовые ходы',
		description:
			'При выборе фигуры показываются только легальные ходы: зелёная точка — ход на пустую клетку, оранжевое кольцо — взятие.',
	},
	{
		id: HintLevel.SPECIAL,
		name: 'Специальные ходы',
		description:
			'Все базовые подсказки плюс отдельная отметка для взятия на проходе, рокировки, двойного шага пешки и превращения. Подсвечивается последний ход.',
	},
	{
		id: HintLevel.FULL,
		name: 'Полный анализ',
		description:
			'Все подсказки уровня «Специальные ходы» плюс шах королю, клетки под ударом пешек и общая подсветка атакованных фигур соперника.',
	},
];

export const HINT_TYPES = {
	move: {
		className: 'hint-move',
		label: 'Ход',
		description: 'Пешка или фигура может пойти на эту пустую клетку.',
		minLevel: HintLevel.BASIC,
	},
	capture: {
		className: 'hint-capture',
		label: 'Взятие',
		description: 'Можно взять фигуру соперника.',
		minLevel: HintLevel.BASIC,
	},
	double: {
		className: 'hint-double',
		label: 'Двойной шаг пешки',
		description: 'Пешка ещё не ходила и может пройти сразу на две клетки вперёд.',
		minLevel: HintLevel.SPECIAL,
	},
	enPassant: {
		className: 'hint-en-passant',
		label: 'Взятие на проходе',
		description:
			'Пешка соперника только что прошла две клетки с начальной позиции. Ваша пешка встаёт на пересечённую клетку, а пешка соперника снимается.',
		minLevel: HintLevel.SPECIAL,
	},
	enPassantVictim: {
		className: 'hint-en-passant-victim',
		label: 'Пешка под ударом (на проходе)',
		description: 'Пешка соперника, которую можно взять на проходе на этом ходу.',
		minLevel: HintLevel.SPECIAL,
	},
	castling: {
		className: 'hint-castling',
		label: 'Рокировка',
		description: 'Король и ладья не ходили, путь свободен и король не под шахом.',
		minLevel: HintLevel.SPECIAL,
	},
	promotion: {
		className: 'hint-promotion',
		label: 'Превращение пешки',
		description: 'Пешка достигнет последней горизонтали и превратится в выбранную фигуру.',
		minLevel: HintLevel.SPECIAL,
	},
	lastMove: {
		className: 'hint-last-move',
		label: 'Последний ход',
		description: 'Клетки, с которых и на которые был сделан предыдущий ход.',
		minLevel: HintLevel.SPECIAL,
	},
	check: {
		className: 'hint-check',
		label: 'Шах',
		description: 'Король находится под ударом и должен защититься.',
		minLevel: HintLevel.FULL,
	},
	pawnAttack: {
		className: 'hint-pawn-attack',
		label: 'Удар пешки',
		description: 'На эту клетку может пойти пешка соперника при взятии.',
		minLevel: HintLevel.FULL,
	},
	attacked: {
		className: 'hint-attacked',
		label: 'Под ударом',
		description: 'Эту фигуру может взять соперник на следующем ходу.',
		minLevel: HintLevel.FULL,
	},
	selected: {
		className: 'hint-selected',
		label: 'Выбранная фигура',
		description: 'Фигура, которую вы выбрали для хода.',
		minLevel: HintLevel.BASIC,
	},
};

export function getVisibleHintTypes(level) {
	return Object.entries(HINT_TYPES)
		.filter(([, hint]) => hint.minLevel <= level && hint.minLevel > 0)
		.map(([type, hint]) => ({ type, ...hint }));
}

export function normalizeHintType(type, level) {
	if (level < HintLevel.SPECIAL) {
		if (type === 'enPassant') {
			return 'capture';
		}
		if (type === 'double' || type === 'castling' || type === 'promotion') {
			return 'move';
		}
	}
	return type;
}
