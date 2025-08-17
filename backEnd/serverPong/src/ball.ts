import { GameObject, Pos, Vect2D } from './gameObject';
import { Paddle } from './paddle';
import { PlayField } from './playField'
import { TICK_RATE } from './serverpong';

export class Ball extends GameObject {
	radius: number;
	speed: number;
	vect: Vect2D;
	playField!: PlayField;

	constructor(pos: Pos, radius: number, speed: number) {
		super(pos);
		this.radius = radius;
		this.speed = speed;
		this.vect = {x: 0,y: 0};
	}

	public launchBall(): void {
		this.pos = { ...this.playField.bounds.center };
		this.vect.x = Math.random() < 0.5 ? 1 : -1;
		this.vect.y = Math.random() < 0.5 ? 1 : -1;
	}

	public transpose(): void {

		this.pos.x += (this.speed * this.vect.x) / TICK_RATE;
		this.pos.y += (this.speed * this.vect.y) / TICK_RATE;

		this.applyPhysics();
	};

	public checkScore(): void {
		let playerSlot: number = -1;

		if ( this.pos.x + this.radius >= this.playField.bounds.right)
			playerSlot = 0;
		if ( this.pos.x - this.radius <= this.playField.bounds.left)
			playerSlot = 1;
		if (playerSlot > -1) {
			this.launchBall();
			this.playField.game.players[playerSlot].score++;
		}
	}

	private applyPhysics(): void {
		let distance!: number;

		if (this.pos.y + this.radius >= this.playField.bounds.bottom) {
			this.pos.y = this.playField.bounds.bottom - this.radius;
			this.vect.y *= -1;
		}
		else if (this.pos.y - this.radius <= this.playField.bounds.top) {
			this.pos.y = this.playField.bounds.top + this.radius;
			this.vect.y *= -1;
		}

		if (this.vect.x < 0) {
			distance = this.getDistance(this.playField.paddle0);
			if (distance <= this.radius)
				this.bounce(this.playField.paddle0, distance);
		}
		else {
			distance = this.getDistance(this.playField.paddle1);
			if (distance <= this.radius)
				this.bounce(this.playField.paddle1, distance);
		}
	}

	private getDistance(paddle: Paddle): number {
		let nearestPos: Pos = {x: 0, y: 0};
		let distance: number;
		let dx!: number;
		let dy!: number;

		let px = paddle.pos.x;
		let py = paddle.pos.y;
		let pw = paddle.rect.width;
		let ph = paddle.rect.height;

		let bx = this.pos.x;
		let by = this.pos.y;
		let br = this.radius;

		nearestPos.x = Math.max(px, Math.min(bx, (px + pw)));
		nearestPos.y = Math.max(py, Math.min(by, (py + ph)));

		dx = bx - nearestPos.x;
		dy = by - nearestPos.y;
		distance = Math.sqrt((Math.pow(dx, 2) + Math.pow(dy, 2)));

		return (distance);
	}

	private bounce(paddle: Paddle, distance: number): void {
		let px = paddle.pos.x;
		let py = paddle.pos.y;
		let pw = paddle.rect.width;
		let ph = paddle.rect.height;

		let bx = this.pos.x;
		let by = this.pos.y;

		let bounce:  number = Math.abs(distance - this.radius);
		let invertedVector: Vect2D = {x: this.vect.x * -1, y: this.vect.y * -1};

		this.pos = this.scaleVect(invertedVector, bounce);

		const horizontal = (bx < px || bx > (px + pw));
		const vertical = (by < py || by > (py + ph));

		if (horizontal && vertical) {
			this.vect.x *= -1;
			this.vect.y *= -1;
		}
		else if (horizontal) {
			this.vect.x *= -1;
		}
		else if (vertical) {
			this.vect.y *= -1;
		}
	}

	private scaleVect(vect: Vect2D, distance: number): Pos {
		let newPos: Pos = this.pos;

		let vectLong: number = Math.sqrt(Math.pow(vect.x, 2) + Math.pow(vect.y, 2));
		let vectNorm: Vect2D = {x: vect.x / vectLong, y: vect.y / vectLong};
		
		newPos.x += vectNorm.x * distance;
		newPos.y += vectNorm.y * distance;
		return (newPos);
	}
}