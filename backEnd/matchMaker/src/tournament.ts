import { Match } from "./match";
import { tournamentManager } from "./matchmaker";
import { Status } from "./matchManager";

export enum Phase {
	DRAW, SEMIFINALS, FINALS, COMPLETED, CANCELED
}
const MAX_PLAYERS: number = 4;

export interface Player {
	id: number;
	name: string;
	avatar: string;
	connection: any;
	card: string;
	ready: boolean;
	score: number;
}

export class Tournament {
	ranking!: [number, Player][];
	matches: Set<Match>;

	private players: Map<number, Player>;
	private phaseLock: Boolean;
	private phase: Phase;

	private tournamentState = {
		type: 'statusUpdate',
		phase: Phase.DRAW,
		cards: [
			{ id: "card-3a", name: "", avatar: "", ready: false },
			{ id: "card-3b", name: "", avatar: "", ready: false },
			{ id: "card-3c", name: "", avatar: "", ready: false },
			{ id: "card-3d", name: "", avatar: "", ready: false },
			{ id: "card-2a", name: "", avatar: "", ready: false },
			{ id: "card-2b", name: "", avatar: "", ready: false },
			{ id: "card-1a", name: "", avatar: "", ready: false }
		],
		ranking: [0, 0, 0, 0]
	};

	constructor() {
		this.players = new Map<number, Player>();
		this.matches = new Set<Match>();
		this.phaseLock = false;
		this.phase = Phase.DRAW;
	}

	public async join(userId: number, connection: any): Promise<void> {
		let userName: string = await this.getPlayerName(userId);
		let userAvatar: string = await this.getPlayerAvatar(userId);

		this.addPlayer({
			id: userId,
			name: userName,
			avatar: userAvatar, 
			connection: connection,
			card: "",
			ready: false,
			score: 0
		});
		await this.sendUserName(connection, userName);
		this.broadcastStatus();
		if (this.players.size == MAX_PLAYERS)
			this.changePhase(Phase.SEMIFINALS);
	}

	private async drawPairings(times: number, interval: number): Promise<void> {
		for (let t = 0; t < times; t++) {
			const cards = this.tournamentState.cards;
			const dataToShuffle = cards.slice(0, 4).map(c => ({
				name: c.name,
				avatar: c.avatar
			}));

			dataToShuffle.sort(() => Math.random() - 0.5);

			for (let i = 0; i < 4; i++) {
				cards[i].name = dataToShuffle[i].name;
				cards[i].avatar = dataToShuffle[i].avatar;
			}

			this.broadcastStatus();
			await new Promise(resolve => setTimeout(resolve, interval));
		}
	}

	public async drawSemifinals(): Promise<void> {
		this.phaseLock = true;

		await this.drawPairings(4, 500);
		await this.sendReadyRequest();
		await this.waitAllPlayersReady();

		const matchA = await tournamentManager.requestPairedMatch(this,
			[	
				this.findPlayerByName(this.tournamentState.cards[0].name).connection,
				this.findPlayerByName(this.tournamentState.cards[1].name).connection,
			],
			[
				this.findPlayerByName(this.tournamentState.cards[0].name).id,
				this.findPlayerByName(this.tournamentState.cards[1].name).id,
			]);

		const matchB =	await tournamentManager.requestPairedMatch(this,
			[
				this.findPlayerByName(this.tournamentState.cards[2].name).connection,
				this.findPlayerByName(this.tournamentState.cards[3].name).connection,
			],
			[
				this.findPlayerByName(this.tournamentState.cards[2].name).id,
				this.findPlayerByName(this.tournamentState.cards[3].name).id,
			]);

		this.matches.add(matchA);
		this.matches.add(matchB);
		console.log(`Info: Tournament semifinals phase has been drawn`);
	}

	public async drawFinals(): Promise<void> {
		this.phaseLock = true;

		let winners: Set<Player> = new Set<Player>();
		let losers: Set<Player> = new Set<Player>();
		
		for (const m of this.matches) {
				winners.add(this.findPlayerById(m.winnerId));
				losers.add(this.findPlayerById(m.loserId));
		}
		this.scoreTournamentPoints(winners);

		const winnersArray = Array.from(winners);
		const losersArray = Array.from(losers);
		
		this.tournamentState.cards[2].name = "";
		this.tournamentState.cards[2].avatar = "";
		this.tournamentState.cards[3].name = "";
		this.tournamentState.cards[3].avatar = "";

		this.tournamentState.cards[0].name = losersArray[0].name;
		this.tournamentState.cards[0].avatar = losersArray[0].avatar;
		this.tournamentState.cards[1].name =  losersArray[1].name;
		this.tournamentState.cards[1].avatar =  losersArray[1].avatar;
		
		this.tournamentState.cards[4].name =  winnersArray[0].name;
		this.tournamentState.cards[4].avatar = winnersArray[0].avatar;
		this.tournamentState.cards[5].name = winnersArray[1].name;
		this.tournamentState.cards[5].avatar = winnersArray[1].avatar;

		this.resetAllReadyStates();

		setTimeout(() => {}, 3000);

		await this.broadcastStatus();
		await this.sendReadyRequest();
		await this.waitAllPlayersReady();
		
		const matchA = await tournamentManager.requestPairedMatch(this,
			[	
				this.findPlayerByName(this.tournamentState.cards[0].name).connection,
				this.findPlayerByName(this.tournamentState.cards[1].name).connection,
			],
			[
				this.findPlayerByName(this.tournamentState.cards[0].name).id,
				this.findPlayerByName(this.tournamentState.cards[1].name).id,
			]);

		const matchB =	await tournamentManager.requestPairedMatch(this,
			[
				this.findPlayerByName(this.tournamentState.cards[4].name).connection,
				this.findPlayerByName(this.tournamentState.cards[5].name).connection,
			],
			[
				this.findPlayerByName(this.tournamentState.cards[4].name).id,
				this.findPlayerByName(this.tournamentState.cards[5].name).id,
			]);
		
		this.matches.clear();
		this.matches.add(matchA);
		this.matches.add(matchB);
		console.log(`Info: Tournament finals phase has been drawn`);
	}

	private scoreTournamentPoints(winners: Set<Player>): void {
		if (this.phase === Phase.SEMIFINALS) {
			for (const p of winners)
				p.score += 5;
		}
		else if (this.phase  === Phase.FINALS) {
			for (const p of winners)
				p.score += 3;
		}
	}

	public async endTournament(): Promise<void> {
		this.phaseLock = true;

		let winners: Set<Player> = new Set<Player>();
		for (const m of this.matches) 
				winners.add(this.findPlayerById(m.winnerId));
		this.scoreTournamentPoints(winners);

		this.ranking = Array.from(this.players.entries());
		this.ranking.sort((a,b) => b[1].score - a[1].score);

		this.tournamentState.cards[6].name = this.ranking[0][1].name;
		this.tournamentState.cards[6].avatar = this.ranking[0][1].avatar;
		this.tournamentState.cards[4].name = this.ranking[1][1].name;
		this.tournamentState.cards[4].avatar = this.ranking[1][1].avatar;
		this.tournamentState.cards[0].name = this.ranking[2][1].name;
		this.tournamentState.cards[0].avatar = this.ranking[2][1].avatar;

		this.tournamentState.cards[1].name = "";
		this.tournamentState.cards[1].avatar = "";
		this.tournamentState.cards[2].name = "";
		this.tournamentState.cards[2].avatar = "";
		this.tournamentState.cards[3].name = "";
		this.tournamentState.cards[3].avatar = "";
		this.tournamentState.cards[5].name = "";
		this.tournamentState.cards[5].avatar = "";

	
		this.resetAllReadyStates();
		this.changePhase(Phase.COMPLETED);

		setTimeout(() => {}, 3000);

		await this.broadcastStatus();

		console.log(`Info: Tournament ended`);
	}

	public async cancel(userId: number): Promise<void> {
		this.phaseLock = true;

		let disconnectedName = await this.getPlayerName(userId);
		
		for (const p of this.players) {
			await (p[1] as Player).connection.send(JSON.stringify({
				type: 'tournamentCancel',
				userName: disconnectedName
			}));
		}
		this.changePhase(Phase.CANCELED);
		console.log(`Info: Tournament canceled`);
	}

	public getPlayers(): Map<number, Player> { return (this.players); }

	public getPhase(): any { return (this.phase) };

	public getPhaseLock(): any { return (this.phaseLock) };

	private async getPlayerName(userId: number): Promise<string> {
		const response = await fetch(`http://dataBase:3000/get/pseudo?id=${userId}`);//changing endpoint from /get/username to /get/pseudo
		const data = await response.json();
		return (data[0].name);
	}

	private async getPlayerAvatar(userId: number): Promise<string> {
		const response = await fetch(`http://dataBase:3000/get/avatar?id=${userId}`);
		const data = await response.json();
		return (data[0].avatar);
	}

	private addPlayer(player: Player): void {
		for (const c of this.tournamentState.cards) {
			if (c.name === "") {
				c.name = player.name;
				c.avatar = player.avatar;
				player.card = c.id;
				this.players.set(player.id, player);
				return;
			}
		}
	}

	private findPlayerByName(name: string): Player {
		let player!: Player;
		
		for (const p of this.players) {
			if (p[1].name == name){
				player = p[1];
				break;
			}
		}
		return (player);
	}


	private findPlayerById(id: number): Player {
		let player!: Player;
		
		for (const p of this.players) {
			if (p[1].id == id){
				player = p[1];
				break;
			}
		}
		return (player);
	}

	private async sendUserName(connection: any, userName: string): Promise<void> {
		await connection.send(JSON.stringify({
			type: 'setUserName',
			userName: userName
		}));
	}

	private async broadcastStatus(): Promise<void> {
		for (const p of this.players) {
			await (p[1] as Player).connection.send(JSON.stringify(this.tournamentState));
		}
	}

	public changePhase(phase: Phase): void {
		this.phaseLock = false;
		this.phase = phase;
		this.tournamentState.phase = phase;
	}

	private async sendReadyRequest(): Promise<void> {
		await this.broadcastStatus();
		for (const p of this.players) {
			await p[1].connection.send(JSON.stringify({
				type: 'readyRequest'
			}));
		}
	}

	public setPlayerReady(userId: number): void {
		for (const p of this.players) {
			if (p[1].id === userId){
				p[1].ready = true;
				for (const c of this.tournamentState.cards) {
					if (c.name == p[1].name) {
						c.ready = true;
						break;
					}
				}
				this.broadcastStatus();
				return;
			}
		}
	}

	private resetAllReadyStates(): void {
		for (const p of this.players) 
			p[1].ready = false;
		for (const c of this.tournamentState.cards)
			c.ready = false;
	}

	private async waitAllPlayersReady(): Promise<void> {
		while (true) {
			let allReady = true;
			for (const p of this.players) {
				if (!p[1].ready) {
					allReady = false;
					break;
				}
			}
			if (allReady)
				break;
			await new Promise(resolve => setTimeout(resolve, 200));
		}
	}

	public async waitAllMatchesEnd(): Promise<void> {
		while (true) {
			let allEnd = true;
			for (const m of this.matches) {
				if (m.status != Status.COMPLETED) {
					allEnd = false;
					break;
				}
			}
			if (allEnd)
				break;
			await new Promise(resolve => setTimeout(resolve, 200));
		}
	}
}