import { Status } from "./matchManager";
import { Tournament, Phase } from "./tournament";

export class Match {
	status: Status;
	matchUID!: number;
	tournamentUID: number;
	tournament!: Tournament | undefined;
	tournamentPhase!: Phase | undefined;
	player0Id: number;
	player0Name!: string;
	player0Conn!: any;
	player1Id: number;
	player1Name!: string;
	player1Conn!: any;
	score: number[] = [0,0];
	winnerId!: number;
	loserId!: number;

	constructor (tournament?: Tournament, tournamentPhase?: Phase){
		this.status = Status.PENDING;
		this.tournamentUID = 0;
		this.tournament = tournament;
		this.tournamentPhase = tournamentPhase;
		this.player0Id = 0;
		this.player1Id = 0;
	}

	public async addPlayer(connection: any, userId: number) {
		if (this.player0Id == 0) {
			this.player0Id = userId;
			this.player0Conn = connection;
			this.player0Name = await this.getPlayerName(this.player0Id);
		} else if (this.player1Id == 0) {
			this.player1Id = userId;
			this.player1Conn = connection;
			this.player1Name = await this.getPlayerName(this.player1Id);
		}
	}

	public checkMatchPlayers(): boolean {
		if (this.player0Id != 0 && this.player1Id != 0) {
			return (true);
		}
		return (false);
	}

	private async getPlayerName(userId: number): Promise<string> {
		const response = await fetch(`http://dataBase:3000/get/pseudo?id=${userId}`);//changing endpoint from /get/username to /get/pseudo
		const data = await response.json();
		return (data[0].name);
	}
}