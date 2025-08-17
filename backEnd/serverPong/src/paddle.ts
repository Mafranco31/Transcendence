import { GameObject, Pos, Rect, Vect2D, Bounds } from './gameObject';
import { PlayField } from './playField'
import { TICK_RATE } from './serverpong';

export class Paddle extends GameObject {
	pid: number;
	speed: number;
	rect: Rect;
	vect: Vect2D;
	bounds: Bounds;
	playField!: PlayField;

	constructor(pid: number, speed: number, rect: Rect, pos: Pos) {
		super(pos);
		this.pid = pid;
		this.speed = speed;
		this.rect = rect;
		this.vect = {x: 0,y: 0};

		this.bounds = {
			bottom: rect.height,
			top: 0,
			left: 0,
			right: rect.width,
			center: {x: rect.width / 2, y: rect.height /2}
		};
	}

	updateVector(direction: string): void {
		switch(direction){
			case 'up':
				this.vect.y = -1;
				break;
			case 'down':
				this.vect.y = 1;
				break;
			case 'stop':
				this.vect.y = 0;
				break;
		}
	}

	transpose(): void {

		this.pos.y += (this.speed * this.vect.y) / TICK_RATE;

		if (this.pos.y < 0)
			this.pos.y = 0;
		else if (this.pos.y + this.bounds.bottom > this.playField.bounds.bottom)
			this.pos.y = this.playField.bounds.bottom - this.rect.height;
	}
}