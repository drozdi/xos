import { Colors } from "./Colors";
import { Board } from "./Board";

import { Pawn } from "./figure/Pawn";
import { King } from "./figure/King";
import { Queen } from "./figure/Queen";
import { Knight } from "./figure/Knight";
import { Bishop } from "./figure/Bishop";
import { Rook } from "./figure/Rook";


export class ChessGame extends Board {
    /**
     * Generate the figures
     * void generateCells() {}
     */
    generateFigures() {
        //new Pawn(Colors.WHITE, this.cells[5][5]);
        //new Pawn(Colors.WHITE, this.cells[5][4]);
        //new Pawn(Colors.BLACK, this.cells[1][3]);
        //new Pawn(Colors.BLACK, this.cells[1][5]);
        this.generatePawns();
        this.generateKings();
        this.generateQueens();
        this.generateBishops();
        this.generateKnights();
        this.generateRooks();
    }
    /**
     * Generate the pawns
     * void generatePawns()
     */
    generatePawns() {
        for (let i = 0; i < 8; i++) {
            new Pawn(Colors.WHITE, this.cells[6][i]);
            new Pawn(Colors.BLACK, this.cells[1][i]);
        }
    }
    /**
     * Generate the kings
     * void generateKings()
     */
    generateKings() {
        new King(Colors.WHITE, this.cells[7][4]);
        new King(Colors.BLACK, this.cells[0][4]);
    }
    /**
     * Generate the queens
     * void generateQueens()
     */
    generateQueens() {
        new Queen(Colors.WHITE, this.cells[7][3]);
        new Queen(Colors.BLACK, this.cells[0][3]);
    }
    /**
     * Generate the bishops
     * void generateBishops()
     */
    generateBishops() {
        new Bishop(Colors.WHITE, this.cells[7][2]);
        new Bishop(Colors.BLACK, this.cells[0][2]);
        new Bishop(Colors.WHITE, this.cells[7][5]);
        new Bishop(Colors.BLACK, this.cells[0][5]);
    }
    /**
     * Generate the knights
     * void generateKnights()
     */
    generateKnights() {
        new Knight(Colors.WHITE, this.cells[7][1]);
        new Knight(Colors.BLACK, this.cells[0][1]);
        new Knight(Colors.WHITE, this.cells[7][6]);
        new Knight(Colors.BLACK, this.cells[0][6]);
    }
    /**
     * Generate the rooks
     * void generateRooks()
     */
    generateRooks() {
        new Rook(Colors.WHITE, this.cells[7][0]);
        new Rook(Colors.BLACK, this.cells[0][0]);
        new Rook(Colors.WHITE, this.cells[7][7]);
        new Rook(Colors.BLACK, this.cells[0][7]);
    }
}