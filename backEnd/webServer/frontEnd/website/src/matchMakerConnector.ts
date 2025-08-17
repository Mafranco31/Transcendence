import { PongGame } from "./pongGame.js";
import { PongTournament } from "./pongTournament.js";

export class MatchMakerConnector {
	private game!: PongGame;
	private tournament!: PongTournament;
	private ws: any;

	constructor(game: PongGame);
	constructor(tournament: PongTournament);

	constructor (context: PongGame | PongTournament) {
		if (context instanceof PongGame)
			this.game = context;
		else if (context instanceof PongTournament)
			this.tournament = context;

		this.connect(context);
		this.setupEvents(context);
	}

	private connect(context: PongGame | PongTournament): void {
		try {
			if (context instanceof PongGame)
				this.ws = new WebSocket(`wss://${window.location.hostname}:8443/matchmaker/front/post/match`);
			else if (context instanceof PongTournament)
				this.ws = new WebSocket(`wss://${window.location.hostname}:8443/matchmaker/front/post/tournament`);
		} catch (error) {
			console.log(`Error: connection to matchMaker failed: ${error}`)
		}
	}

	private setupEvents(context: PongGame | PongTournament): void {

		if (context instanceof PongGame) {
			this.ws.onmessage = (event: any) => {
				const data = JSON.parse(event.data);
				switch(data.type) {
					case 'accepted':
						this.sendMatchRequest();
						break;
					case 'matchResponse':
						console.log("Info: Recieved match response from matchMaker");
						this.handleMatchResponse(data);
						break;
				}
			};
		}
		else if (context instanceof PongTournament) {
			this.ws.onmessage = (event: any) => {
				const data = JSON.parse(event.data);
				switch(data.type) {
					case 'accepted':
						this.sendTournamentRequest();
						break;
					case 'statusUpdate':
						console.log(`Info: Recieved tournament status update from matchmaker`)
						this.tournament.updateState(data);
						break;
					case 'readyRequest':
						this.tournament.enableButtons();
						break;
					case 'matchResponse':
						console.log("Info: Recieved match response from matchMaker");
						this.handleTournamentMatchResponse(data);
						break;
					case 'setUserName':
						console.log(`Info: Recieved userName: ${data.userName} from matchMaker`);
						this.tournament.setUserName(data.userName);
						break;
					case 'tournamentCancel':
						console.log(`Info: Tournament was cancelled`);
						this.tournament.cancelTournament(data.userName);
						break;
				}
			};
		}

		this.ws.onclose = () => {
			console.log('Disconected from match maker.');
		};

	}

	private sendMatchRequest(): void {
		this.ws.send(JSON.stringify({
			type: 'matchRequest'
		}));
		console.log("Info: Match request sent to matchMaker");
	}


	private handleMatchResponse(data: any) {
		this.game.leftPlayerName = data.player0Name;
		this.game.rightPlayerName = data.player1Name;
		this.game.announceMatch();
		this.ws.close();
	}

	private sendTournamentRequest(): void {
		this.ws.send(JSON.stringify({
			type: 'tournamentRequest'
		}));
		console.log("Info: Tournament request sent to matchMaker");
	}

	public sendReadyState(): void {
		this.ws.send(JSON.stringify({
			type: 'readyState'
		}));
		console.log("Info: player ready state sent to matchMaker");
	}

	private handleTournamentMatchResponse(data: any) {
		this.game = new PongGame();
		this.game.leftPlayerName = data.player0Name;
		this.game.rightPlayerName = data.player1Name;
		this.tournament.displayPlayfield();
		this.game.announceMatch();
	}
 
	public closeConnection = () => {
		console.log(`DEBUG: cleanup closing connection`);
		this.ws.close();
	}
}