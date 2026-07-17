import { Figures } from '../models/figure/Base';
import { Colors } from '../models/Colors';
import bQ from '../assets/chess/bQ.png';
import wQ from '../assets/chess/wQ.png';
import bR from '../assets/chess/bR.png';
import wR from '../assets/chess/wR.png';
import bB from '../assets/chess/bB.png';
import wB from '../assets/chess/wB.png';
import bN from '../assets/chess/bN.png';
import wN from '../assets/chess/wN.png';

const PROMOTION_OPTIONS = [
	{ label: Figures.QUEEN, black: bQ, white: wQ },
	{ label: Figures.ROOK, black: bR, white: wR },
	{ label: Figures.BISHOP, black: bB, white: wB },
	{ label: Figures.KNIGHT, black: bN, white: wN },
];

function PromotionModal({ color, onSelect }) {
	return (
		<div className="promotion-overlay">
			<div className="promotion-modal">
				<h3>Выберите фигуру</h3>
				<div className="promotion-options">
					{PROMOTION_OPTIONS.map(({ label, black, white }) => (
						<button
							key={label}
							type="button"
							className="promotion-option"
							title={label}
							onClick={() => onSelect(label)}
						>
							<img src={color === Colors.BLACK ? black : white} alt={label} />
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export default PromotionModal;
