import { PlayField } from './playField';
import { Ball } from './ball';
import { Paddle } from './paddle';

import { TICK_INTERVAL,
		 PLAYFIELD_POS, PLAYFIELD_SIZE,
		 PADDLE_SPEED, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN,
		 BALL_RADIUS, BALL_SPEED,
		 MAX_SCORE, 
		 standardGameManager } from './serverpong';

import { clearInterval } from 'timers';

enum Status {
	PENDING, ONGOING, COMPLETED, DISCONNECTED
}

export class Player {
	connection!: any;
	userId!: number;
	name!: string;
	score!: number;
	public isReady: boolean;

	constructor(connection: any) {
		this.connection = connection;
		this.score = 0;
		this.isReady = false;
	}
}

export class StandardGameManager {
	private StandardGameList: Set<StandardGame>;

	constructor() {
		this.StandardGameList = new Set<StandardGame>();
	}

	public createGame(player0Id: number, player1Id: number): StandardGame {
		let newGame: StandardGame = new StandardGame(player0Id, player1Id);
		this.StandardGameList.add(newGame);
		return (newGame);
	}

	public joinGame(player: Player): StandardGame {
		let newGame: StandardGame  = this.findGame(player);
		newGame.addPlayer(player);
		return (newGame);
	}

	private findGame(player: Player): StandardGame {
		let pongGame!: StandardGame;

		for(const game of this.StandardGameList) {
			if (game.expectedPlayer0Id == player.userId || game.expectedPlayer1Id == player.userId)
				pongGame = game;
		}
		return (pongGame);
	}

	public getGamebyUserId(userId: number): StandardGame | null {
		let game!: StandardGame;

		for (const g of this.StandardGameList){
			if (g.players[0].userId === userId || g.players[1].userId === userId)
				return (g);
		}
		return (null);
	}

	public deleteGame(game: StandardGame): void {
		this.StandardGameList.delete(game);
		game.cancel();
	}

}

export abstract class PongGame {
	public playField: PlayField;
	public players!: Player[];
	public expectedPlayer0Id!: number;
	public expectedPlayer1Id!: number;

	protected gameLoop!: NodeJS.Timeout;
	protected status!: Status;
	protected winnerId!: number;
	protected loserId!: number;
	protected endType!: string;

	constructor(player0Id: number, player1Id: number) {

		this.players = new Array(2);
		this.status = Status.PENDING;
		this.playField = new PlayField(this, PLAYFIELD_SIZE, PLAYFIELD_POS);
		this.expectedPlayer0Id = player0Id;
		this.expectedPlayer1Id = player1Id;

		this.playField.setPaddle0(new Paddle(
			0,
			PADDLE_SPEED,
			{width: PADDLE_WIDTH, height: PADDLE_HEIGHT},
			{x: this.playField.bounds.left + PADDLE_MARGIN, y: this.playField.bounds.center.y - PADDLE_HEIGHT/2},
		));

		this.playField.setPaddle1(new Paddle(
			1,
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

	public abstract gameStart(connection: any): void;
	public abstract gameEnd(playerDisconected:  Player | null): void;
}

export class StandardGame extends PongGame {
	
	constructor(player0Id: number, player1Id: number) {
		super(player0Id, player1Id);
	}

	public addPlayer(player: Player): void {
		if (this.players[0] && this.players[1]) {
			player.connection.close();
			return;
		}
		
		if (player.userId == this.expectedPlayer0Id)
			this.players[0] = player;
		else if (player.userId == this.expectedPlayer1Id)
			this.players[1] = player;
		if (this.players[0] && this.players[1])
			console.log(`Info: added player, ${this.players[0].name} vs ${this.players[1].name}`);
	}

	public getPlayerById(userId: number): Player | null {
		for (const p of this.players) {
			if (p.userId == userId)
				return  (p)
		}
		return (null);
	}

	private playersReady(): boolean {
		for (let player of this.players) {
			if (!player || player.isReady == false)
				return (false);
		}
		return (true);
	}

	public async waitPlayers(): Promise<void> {
		console.log('Info: Waiting players...');
		await new Promise(resolve => {
			const interval = setInterval(() => {
				if (this.playersReady()) {
					clearInterval(interval);
					resolve(true);
				}
			}, 500);
		});
	}
	
	public gameSetup(player: Player): void {
		player.connection.send(JSON.stringify({
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

	public async gameStart(): Promise<void> {
		await this.waitPlayers();

		if (this.status != Status.PENDING)
			return;
		else
			this.status = Status.ONGOING;

		console.log(`Info: Game has started!: [ id: ${this.players[0].userId} vs id: ${this.players[1].userId}]`);
		this.playField.ball.launchBall();

		this.gameLoop = setInterval(() => {

			this.playField.paddle0.transpose();
			this.playField.paddle1.transpose();
			this.playField.ball.transpose();
			this.playField.ball.checkScore();

			if (this.players[0].score >= MAX_SCORE || this.players[1].score >= MAX_SCORE) {
				clearInterval(this.gameLoop);
				this.gameEnd(null);
				return;
			}

			this.broadcastSend(JSON.stringify({
				type: 'update',
				ballPos: this.playField.ball.pos,
				paddlesPos: [
					this.playField.paddle0.pos,
					this.playField.paddle1.pos
				],
				score: [this.players[0].score, this.players[1].score]
			}));
			
		}, TICK_INTERVAL);
	}

	public async activateMatchDaemon(connection: any): Promise<void> {

		console.log('Info: Setup game end daemon...');
		await new Promise(resolve => {
			const interval = setInterval(() => {
				if (this.status == Status.COMPLETED || this.status == Status.DISCONNECTED) {
					clearInterval(interval);
					resolve(true);
				}
			}, 300);
		});

		connection.send(JSON.stringify({
			type: this.endType,
			winnerId: this.winnerId,
			winnerName: this.getPlayerById(this.winnerId)?.name,
			loserId: this.loserId,
			score: [this.players[0].score, this.players[1].score]
		}))
		console.log(`Info: Sent game summary to matchMaker. WinnerId: ${this.winnerId} LoserId: ${this.loserId}`);
	}

	public gameEnd(disconnectedPlayer: Player | null): void {

		if (this.status == Status.COMPLETED || this.status == Status.DISCONNECTED)//added : || this.status == Status.DISCONNECTED bc gameEnd is called multiple times and if there is a disconnection the call that is posted in database was the one without disconnection
			return;
		if (disconnectedPlayer != null) {
			this.winnerId = this.players[0].userId != disconnectedPlayer.userId ? this.players[0].userId : this.players[1].userId;
			this.loserId = this.players[0].userId == disconnectedPlayer.userId ? this.players[0].userId : this.players[1].userId;

			console.log(`Info: Player disconnected: ${disconnectedPlayer.userId}`);
			console.log(`Info: WinnerId: ${this.winnerId} LoserId: ${this.loserId}`);
			this.endType = 'playerDisconnected';
			this.status = Status.DISCONNECTED;
		} else {
			this.winnerId = this.players[0].score > this.players[1].score ? this.players[0].userId : this.players[1].userId;
			this.loserId = this.players[0].score < this.players[1].score ? this.players[0].userId : this.players[1].userId;
			console.log(`Info: Game ended normally: winnerId: ${this.winnerId} loserId: ${this.loserId}`);
			this.endType = 'endGame';
			this.status = Status.COMPLETED;
		}

		this.broadcastSend(JSON.stringify({
			type: this.endType,
			winnerId: this.winnerId,
			winnerName: this.getPlayerById(this.winnerId)?.name,
			loserId: this.loserId,
			score: [this.players[0].score, this.players[1].score]
		}));
		console.log("Info: Sent game summary to players");

		standardGameManager.deleteGame(this);
		this.broadcastClose();
	}

	private broadcastSend(json: string): void {
		for (const player of this.players){
			player.connection.send(json);
		}
	}

	private broadcastClose(): void {
		for (const player of this.players){
			player.connection.close();
		}
	}

	public cancel(): void {
		console.log(`Info: game was canceled`);
		this.broadcastClose();
	}
}