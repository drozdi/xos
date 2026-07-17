import { Base, Figures } from './Base.js';
import { Colors } from '../Colors.js';
import blackImg from '../../assets/chess/bN.png'
import whiteImg from '../../assets/chess/wN.png'

export class Knight extends Base {
    constructor(color, cell) {
        super(color, cell);
        this.label = Figures.KNIGHT;
        this.img = color === Colors.BLACK ? blackImg : whiteImg;
    }
    canMove(target, isColor = true) {
        if (!super.canMove(target, isColor)) {
            return false;
        }
        const dx = Math.abs(target.x - this.cell.x);
        const dy = Math.abs(target.y - this.cell.y);
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
    }
}
