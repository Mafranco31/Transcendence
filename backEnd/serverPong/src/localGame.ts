const	P1 = 0;
const	P2 = 1;
const	TICK_RATE = 60;
const	TICK_INTERVAL = 1000 / TICK_RATE;
const	PLAYFIELD_SIZE = {width: 1280, height: 720};
const	PLAYFIELD_POS = {x: 0, y: 0}
const	BALL_SPEED = 600;
const	BALL_RADIUS = 32;
const	PADDLE_SPEED = 1000;
const	PADDLE_WIDTH = 64;
const	PADDLE_HEIGHT = 256;
const	PADDLE_MARGIN = 32;
const	MAX_SCORE = 3;

abstract class GameObject {
	pos: Pos;

	constructor(pos: Pos) {
		this.pos = pos;
	}
}

class PlayField extends GameObject {
	rect: Rect;
	bounds: Bounds;
	game: LocalGame;
	paddle0!: Paddle;
	paddle1!: Paddle;
	ball!: Ball;

	constructor(game: LocalGame, rect: Rect, pos: Pos) {
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

interface Pos {
	x: number;
	y: number;
}

interface Vect2D {
	x: number;
	y: number;
}

interface Rect {
	width: number;
	height: number;
}

interface Bounds {
	top: number;
	bottom: number;
	left: number;
	right: number;
	center: Pos;
}

class Ball extends GameObject {
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
		if ( this.pos.x + this.radius >= this.playField.bounds.right) {
			this.launchBall();
			this.playField.game.score[P1]++;
		}
		else if ( this.pos.x - this.radius <= this.playField.bounds.left){
			this.launchBall();
			this.playField.game.score[P2]++;
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

class Paddle extends GameObject {
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

export class LocalGame {
	gameUID: number;
	score: number[];
	playersUID: number [];
	maxScore: number;
	playField: PlayField;
	private gameLoop!: NodeJS.Timeout;

	constructor(gameUID: number) {
		this.gameUID = gameUID;
		this.score = [0,0];
		this.maxScore = MAX_SCORE;
		this.playersUID = [0,0];

		this.playField = new PlayField(this, PLAYFIELD_SIZE, PLAYFIELD_POS);

		this.playField.setPaddle0(new Paddle(
			P1,
			PADDLE_SPEED,
			{width: PADDLE_WIDTH, height: PADDLE_HEIGHT},
			{x: this.playField.bounds.left + PADDLE_MARGIN, y: this.playField.bounds.center.y - PADDLE_HEIGHT/2},
		));

		this.playField.setPaddle1(new Paddle(
			P2,
			PADDLE_SPEED,
			{width: PADDLE_WIDTH, height: PADDLE_HEIGHT},
			{x: this.playField.bounds.right - PADDLE_MARGIN - PADDLE_WIDTH, y: this.playField.bounds.center.y - PADDLE_HEIGHT/2},
		));

		this.playField.setBall(new Ball(
			this.playField.bounds.center,
			BALL_RADIUS,
			BALL_SPEED,
		));
	}

	public gameSetup(connection: any): void {
		console.log("Sent message: Game configuration");

		connection.send(JSON.stringify({
			type: 'setupResponse',
			ballPos: { x: this.playField.ball.pos.x, y: this.playField.ball.pos.y },
			ballRadius: this.playField.ball.radius,
			paddlesPos: [
				{ x: this.playField.paddle0.pos.x, y: this.playField.paddle0.pos.y },
				{ x: this.playField.paddle1.pos.x, y: this.playField.paddle1.pos.y }
			],
			paddleHeight: this.playField.paddle0.rect.height,
			paddleWidth: this.playField.paddle0.rect.width,
			score: [0, 0]
		}));
	}

	public gameStart(connection: any, player1UID: number, player2UID: number): void {
		this.playField.ball.launchBall();
		this.playersUID[P1] = player1UID;
		this.playersUID[P2] = player2UID;

		this.gameLoop = setInterval(() => {

			this.playField.paddle0.transpose();
			this.playField.paddle1.transpose();
			this.playField.ball.transpose();
			this.playField.ball.checkScore();

			if (this.score[P1] >= this.maxScore || this.score[P2] >= this.maxScore) {
				clearInterval(this.gameLoop);
				this.gameEnd(connection);
				return;
			}

			connection.send(JSON.stringify({
				type: 'update',
				ball: this.playField.ball.pos,
				paddles: [
					this.playField.paddle0.pos,
					this.playField.paddle1.pos
				],
				score: this.score
			}));

		}, TICK_INTERVAL);
	}

	public gameEnd(connection: any): void {
		let winnerUID: number = this.score[P1] > this.score[P2] ? this.playersUID[P1] : this.playersUID[P2];
		console.log("Sent message: End game summary");

		connection.send(JSON.stringify({
			type: 'endGame',
			gameUID: this.gameUID,
			player1UID: this.playersUID[P1],
			player2UID: this.playersUID[P2],
			winnerUID: winnerUID,
			score: this.score
		}));

		connection.close();
	}
}
