import { GameObject, Pos, Rect, Bounds } from './gameObject';
import { PongGame } from './pongEngine';
import { Paddle } from './paddle';
import { Ball } from './ball';

export class PlayField extends GameObject {
	rect: Rect;
	bounds: Bounds;
	game: PongGame;
	paddle0!: Paddle;
	paddle1!: Paddle;
	ball!: Ball;

	constructor(game: PongGame, rect: Rect, pos: Pos) {
		super(pos);
		this.rect = rect;
		this.game = game;

		this.bounds = {
			bottom: rect.height,
			top: 0,
			left: 0,
			right: rect.width,
			center: {x: rect.width / 2, y: rect.height /2}
		};
	}

	setPaddle0(paddle0: Paddle) {
		paddle0.playField = this;
		this.paddle0 = paddle0
	};

	setPaddle1(paddle1: Paddle) {
		paddle1.playField = this;
		this.paddle1 = paddle1
	};

	setBall(ball: Ball) {
		ball.playField = this;
		this.ball = ball;
	};
}