import { matchManager, tournamentManager } from './matchmaker'
import { Phase, Tournament } from './tournament';
import { Match } from './match';

export abstract class Endpoint {

	protected static list: Set<Endpoint> = new Set();
	protected path: string;
	protected errorMsg: string;

	constructor(path: string, errorMsg: string	) {
		this.path = path;
		this.errorMsg = errorMsg;
		Endpoint.list.add(this);
	}
	
	public static enableAll(server: any): void {
		for (const endpoint of Endpoint.list)
			endpoint.add(server);
	}
	
	protected abstract add(server: any): void;

	protected async validateSession(sessionToken: any): Promise<number | null> {
		const reply = await fetch(`http://userAuthentication:3000/userauthentication/front/get/profile_session_with_token?token=${sessionToken}`, {
			method: 'GET'
		});
		if (reply.ok) {
			const data = await reply.json();
			console.log(`Info: UserId ${data.id} session confirmed`);
			return data.id;
		} else {
			console.log('Info: Invalid user session');
			return (null);
		}
	}

	protected retrieveSessionToken(request: any): any {
		const cookieHeader = request.headers.cookie;
		if (cookieHeader) {
			const cookies = cookieHeader.split(';');
			for (const c of cookies) {
				const [name, value] = c.trim().split('=');
				if (name === 'token') {
					return value;
				}
			}
		}
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

export class PostMatchRequest extends Endpoint {

	add(server: any): void {
		server.get(this.path, { websocket: true }, async (connection: any, req: any) => {

			let sessionToken!: any;
			let userId!: any;
			
			sessionToken = this.retrieveSessionToken(req);
			userId = await this.validateSession(sessionToken);
			if (sessionToken == null || userId == null) {
				this.replyNotAllowed(connection);
				return;
			}
			this.replyAccepted(connection);

			connection.on('message', (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());
					switch (jsonData.type) {
						case 'matchRequest':
							console.log(`Info: Recieved matchRequest from userId ${userId}`);
							matchManager.requestMatch(connection, userId);
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
					this.replyServerError(connection);
					return;
				}
			});

			connection.on('close', () => {
				console.log("Client left the matchMaker");
			});
		});
	}
}

export class PostTournamentRequest extends Endpoint {
	add(server: any): void {
		server.get(this.path, { websocket: true }, async (connection: any, req: any) => {
			
			let sessionToken!: any;
			let userId!: any;
			let tournament!: Tournament | null;
			
			sessionToken = this.retrieveSessionToken(req);
			userId = await this.validateSession(sessionToken);
			if (sessionToken == null || userId == null) {
				this.replyNotAllowed(connection);
				return;
			}
			this.replyAccepted(connection);

			connection.on('message', async (data: any) => {
				try {
					const jsonData = JSON.parse(data.toString());

					switch (jsonData.type) {
						case 'tournamentRequest':
							console.log("Info: Tournament request recieved");
							tournament = await tournamentManager.requestTournament(connection, userId);
							break;
						case 'readyState':
							console.log(`Info: Recieved readyState from UserId ${userId}`);
							tournament?.setPlayerReady(userId);
							break;
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			connection.on('close', () => {
				console.log("Client left the matchMaker");
				if (tournament?.getPhase() != Phase.COMPLETED)
					tournament?.cancel(userId);
			});
		});
	}
}