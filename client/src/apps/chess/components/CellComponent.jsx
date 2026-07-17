import { HINT_TYPES } from '../models/hints/HintLevels';

function CellComponent({ cell, selected = false, locked = false, onClick = () => {} }) {
	const hintClasses = Object.entries(cell.hints)
		.filter(([, active]) => active)
		.map(([type]) => HINT_TYPES[type]?.className)
		.filter(Boolean);

	return (
		<div
			onClick={() => onClick(cell)}
			className={[
				'cell',
				cell.color,
				selected ? 'hint-selected' : '',
				locked ? 'hint-locked' : '',
				...hintClasses,
			]
				.filter(Boolean)
				.join(' ')}
		>
			{cell.figure && <img src={cell.figure.img} alt={cell.figure.label} />}
		</div>
	);
}

export default CellComponent;
