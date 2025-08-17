export interface Pos {
	x: number;
	y: number;
}

export interface Vect2D {
	x: number;
	y: number;
}

export interface Rect {
	width: number;
	height: number;
}

export interface Bounds {
	top: number;
	bottom: number;
	left: number;
	right: number;
	center: Pos;
}

export abstract class GameObject {
	pos: Pos;

	constructor(pos: Pos) {
		this.pos = pos;
	}
}