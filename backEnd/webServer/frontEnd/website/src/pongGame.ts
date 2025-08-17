import { clearTimeout } from "timers";
import { MatchMakerConnector } from "./matchMakerConnector.js";
import { ServerPongConnector } from "./serverPongConnector.js";

export class PongGame {
	private playField: any = document.getElementById('playField');
	private ctx2d: any = this.playField.getContext('2d');
	private scoreElement: any = document.getElementById('score');
	private matchMakerConnector!: MatchMakerConnector;
	private serverPongConnector!: ServerPongConnector;

	private countDownInterval!: any;

	public leftPlayerName!: string;
	public rightPlayerName!: string;

	public PADDLE_WIDTH!: number;
	public PADDLE_HEIGHT!: number;
	public BALL_RADIUS!: number;
	
	private gameState = {
		ball: { x: 0, y: 0 },
		paddles: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0 }
		],
		score: [0, 0]
	};

	constructor () {}

	public async start(): Promise<void> {
		this.drawWaitScreen();
		this.matchMakerConnector = new MatchMakerConnector(this);
	}

	public announceMatch(): void {
		let countdown = 3;
		this.serverPongConnector = new ServerPongConnector(this);

		const drawCurrentAnnounceState = (currentCountdownValue: any) => {
			this.ctx2d.fillStyle = '#1a1a1a';
			this.ctx2d.fillRect(0, 0, this.playField.width, this.playField.height);

			this.ctx2d.fillStyle = 'white';
			this.ctx2d.font = '28px monospace';

			this.ctx2d.textAlign = 'left';
			this.ctx2d.fillText(this.leftPlayerName, 70, this.playField.height / 2 - 30);

			this.ctx2d.textAlign = 'right';
			this.ctx2d.fillText(this.rightPlayerName, this.playField.width - 70, this.playField.height / 2 - 30);

			this.ctx2d.textAlign = 'center';
			this.ctx2d.font = '36px monospace';
			this.ctx2d.fillText(`Match ID: ${'LOADING...'}`, this.playField.width / 2, this.playField.height / 2 - 100);

			if (currentCountdownValue > 0) {
				this.ctx2d.font = '120px monospace';
				this.ctx2d.fillStyle = 'yellow';
				this.ctx2d.fillText(currentCountdownValue.toString(), this.playField.width / 2, this.playField.height / 2 + 70);
			}
		};

		drawCurrentAnnounceState(countdown);

		this.countDownInterval = setInterval(() => {
			countdown--;

			if (countdown > 0) {
				drawCurrentAnnounceState(countdown);
			} else {
				clearInterval(this.countDownInterval);
				this.ctx2d.fillStyle = '#1a1a1a';
				this.ctx2d.fillRect(0, 0, this.playField.width, this.playField.height);
			}
		}, 1000);
	}

	private drawWaitScreen(): void {
		this.ctx2d.fillStyle = '#1a1a1a';
		this.ctx2d.fillRect(0, 0, this.playField.width, this.playField.height);

		this.ctx2d.fillStyle = 'white';
		this.ctx2d.font = '48px monospace';
		this.ctx2d.textAlign = 'center';
		this.ctx2d.fillText('FINDING A MATCH', this.playField.width / 2, this.playField.height / 2);
	}

	public drawFrame(): void {
		// playField
		this.ctx2d.fillStyle = '#1a1a1a';
		this.ctx2d.fillRect(0, 0, this.playField.width, this.playField.height);

		// paddles
		this.ctx2d.fillStyle = 'white';
		this.gameState.paddles.forEach(paddle => {
			this.ctx2d.fillRect(
				paddle.x,
				paddle.y,
				this.PADDLE_WIDTH,
				this.PADDLE_HEIGHT
			);
		});

		// ball
		this.ctx2d.beginPath();
		this.ctx2d.arc(this.gameState.ball.x, this.gameState.ball.y, this.BALL_RADIUS, 0, Math.PI * 2);
		this.ctx2d.fill();

		// score
		this.scoreElement.textContent = `${this.gameState.score[0]} - ${this.gameState.score[1]}`;
	}

	public drawEndGameScreen(endGameData: any): void {
		//clear countdown
		if (this.countDownInterval)
			clearInterval(this.countDownInterval);

		// canvas
		this.ctx2d.fillStyle = '#1a1a1a';
		this.ctx2d.fillRect(0, 0, this.playField.width, this.playField.height);

		// results
		this.ctx2d.fillStyle = 'white';
		this.ctx2d.font = '48px monospace';
		this.ctx2d.textAlign = 'center';
		
		// title
		if (endGameData.type == 'playerDisconnected')
			this.ctx2d.fillText('RAGE QUIT!', this.playField.width/2, this.playField.height/3);
		else
			this.ctx2d.fillText('Game Over!', this.playField.width/2, this.playField.height/3);

		// score
		this.scoreElement.textContent = `${endGameData.score[0]} - ${endGameData.score[1]}`;
		this.ctx2d.font = '36px monospace';
		this.ctx2d.fillText(`Final Score: ${endGameData.score[0]} - ${endGameData.score[1]}`, 
			this.playField.width/2, this.playField.height/2);
		
		// winner
		this.ctx2d.fillText(`Winner: ${endGameData.winnerName}`, this.playField.width/2, this.playField.height/2 + 50);
	}

	public setGameState(data: any): void {
		this.gameState.ball = data.ballPos;
		this.gameState.paddles = data.paddlesPos;
		this.gameState.score = data.score;
	}

	public cleanUp = () => {
 		if (this.matchMakerConnector)
			this.matchMakerConnector.closeConnection();
		if (this.serverPongConnector)
			this.serverPongConnector.closeConnection();
 		if (this.countDownInterval)
			clearInterval(this.countDownInterval);
	}
}