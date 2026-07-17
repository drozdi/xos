import { Base, Figures } from './Base.js';
import { Colors } from '../Colors.js';
import blackImg from '../../assets/chess/bR.png'
import whiteImg from '../../assets/chess/wR.png'

export class Rook extends Base {
    constructor(color, cell) {
        super(color, cell);
        this.label = Figures.ROOK;
        this.img = color === Colors.BLACK ? blackImg : whiteImg;
    }
    canMove(target, isColor = true) {
        if (!super.canMove(target, isColor)) {
            return false;
        }
        if (this.cell.emptyV(target)) {
            return true;
        }
        if (this.cell.emptyH(target)) {
            return true;
        }
        return false;
    }
}
