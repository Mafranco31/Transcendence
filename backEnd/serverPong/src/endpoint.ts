import { StandardGame, Player } from './pongEngine'
import { standardGameManager } from './serverpong';
import { LocalGame } from './localGame';

export abstract class Endpoint {
	protected static list: Set<Endpoint> = new Set();
	protected path: string;
	protected errorMsg: string;
	protected sessionToken!: any;

	constructor(path: string, errorMsg: string	) {
		this.path = path;
		this.errorMsg = errorMsg;
		Endpoint.list.add(this);
	}
	
	protected abstract add(server: any): void;

	public static enableAll(server: any): void {
		for (const endpoint of Endpoint.list)
			endpoint.add(server);
	}

	private async getPlayerName(userId: number): Promise<string> {
		const response = await fetch(`http://dataBase:3000/get/pseudo?id=${userId}`);//changing endpoint from /get/username to /get/pseudo
		const data = await response.json();
		return (data[0].name);
	}

	protected async validateSession(player: Player): Promise<boolean> {
		const reply = await fetch(`http://userAuthentication:3000/userauthentication/front/get/profile_session_with_token?token=${this.sessionToken}`, {
			method: 'GET'
		});
		if (reply.ok) {
			const data = await reply.json();
			console.log(`Info: UserId ${data.id} session confirmed`);
			player.userId = data.id;
			player.name = await this.getPlayerName(player.userId);
			return (true);
		} else {
			console.log('Info: Invalid user session');
			return (false);
		}
	}
	
	protected retrieveSessionToken(request: any): any {
			const cookieHeader = request.headers.cookie;
			if (cookieHeader) {
				const cookies = cookieHeader.split(';');
				for (const c of cookies) {
					const [name, value] = c.trim().split('=');
					if (name === 'token') {
						this.sessionToken = value;
						break;
					}
				}
			}
			return (this.sessionToken);
	}

	protected replyAccepted(connection: any): void {
		connection.send(JSON.stringify({
		type: 'accepted',
		code: 202,
		message: 'Token accepted'
		}));
	}

	protected replyNotAllowed(connection: any): void {
		connection.send(JSON.stringify({
		type: 'error',
		code: 403,
		message: 'Not allowed please login'
		}));
		connection.close();
	}

	protected replyServerError(connection: any): void {
		connection.send(JSON.stringify({
		type: 'error',
		code: 500,
		message: 'Internal server error'
		}));
		connection.close();
	}
}

export class PostNewMatch extends Endpoint {
	add(server: any): void {
		let actualGame!: StandardGame;

		server.get(this.path, { websocket: true }, (connection: any, request: any) => {
			connection.on('message', (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());
					console.log("Received message:", jsonData);

					switch (jsonData.type) {
						case 'postMatchRequest':
							console.log("Info: Match request recieved");
							actualGame = standardGameManager.createGame(jsonData.player0Id, jsonData.player1Id);
							actualGame.activateMatchDaemon(connection);
							connection.send(JSON.stringify({
								type: 'postMatchResponse'
							}));
							console.log("Info: post match confirmation sent");
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			connection.on('close', () => {
				console.log("Info: MatchMaker disconnected!");
			});
		});
	}
}

export class DeleteOngoingMatch extends Endpoint {
	add(server: any): void {
		server.get(this.path, { websocket: true }, async (connection: any, req: any) => {

			let targetMatch!: StandardGame | null;

			connection.on('message', async (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());
					switch (jsonData.type) {
						case 'cancelMatch':
							console.log("Info: Match cancel request recieved");
							targetMatch = standardGameManager.getGamebyUserId(jsonData.userId);
							if (targetMatch){
								targetMatch.gameEnd(targetMatch.getPlayerById(jsonData.disconnectedId));
								standardGameManager.deleteGame(targetMatch);
							}
							connection.close();
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			connection.on('close', () => {
				console.log(`Info: Connection to user ended due to cancelation`);
			});
		});
	}
}


export class GetNewGame extends Endpoint {
	add(server: any): void {
		server.get(this.path, { websocket: true }, async (connection: any, req: any) => {

			let currentGame!: StandardGame;
			let player: Player = new Player(connection);

			const sessionToken = this.retrieveSessionToken(req);
			if (sessionToken == null || !(await this.validateSession(player))) {
				this.replyNotAllowed(connection);
				return;
			}
			this.replyAccepted(connection);

			connection.on('message', async (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());
					switch (jsonData.type) {
						case 'setupRequest':
							console.log(`Info: PlayerId ${player.userId} is requesting setup data`);
							currentGame = await standardGameManager.joinGame(player);
							currentGame.gameSetup(player);
							console.log("Info: Sent setupResponse to user: " + player.userId);
							break;
						case 'startRequest':
							console.log("Info: Player " + player.userId + " is ready");
							player.isReady = true;
							currentGame.gameStart();
							break;
						case 'input':
							if (player.userId == currentGame.players[0].userId)
								currentGame.playField.paddle0.updateVector(jsonData.direction);
							else if (player.userId == currentGame.players[1].userId)
								currentGame.playField.paddle1.updateVector(jsonData.direction);
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			connection.on('close', () => {
				console.log(`Info: userId: ${player.userId} disconnected!`);
				currentGame.gameEnd(player);
			});
		});
	}
}


//Local Game endpoint
export class GetLocalGame extends Endpoint {
	private currentGame!: LocalGame;

	add(server: any): void {
		server.get(this.path, { websocket: true }, (connection: any, req: any) => {
			
			connection.on('message', (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());
					console.log("Received message:", jsonData);

					switch (jsonData.type) {
						case 'setupRequest':
							this.currentGame = new LocalGame(jsonData.gameUID);
							this.currentGame.gameSetup(connection);
							break;
						case 'newGame':
							console.log("NewGame requested!");

							this.currentGame.gameStart(connection, jsonData.player1UID, jsonData.player2UID);
							break;
						case 'input':
							console.log("Input recieved!");
							if (jsonData.playerId == '0')
								this.currentGame.playField.paddle0.updateVector(jsonData.direction);
							else if (jsonData.playerId == '1')
								this.currentGame.playField.paddle1.updateVector(jsonData.direction);
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			connection.on('close', () => {
				console.log("Client disconnected!");
				this.currentGame.gameEnd(connection);
			});
		});
	}
}