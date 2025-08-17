import { MatchMakerConnector } from "./matchMakerConnector.js";

export enum Phase {
	DRAW, SEMIFINALS, FINALS, COMPLETED, CANCELED
}

export class PongTournament {
	private matchMakerConnector!: MatchMakerConnector;
	private messageFrame!: HTMLElement | null;
	private gameFrame!: HTMLElement | null;
	private tournamentFrame!: HTMLElement | null
	private userName!: string;

	private tournamentState = {
		type: 'statusUpdate',
		phase: 0,
		cards: [
			{ id: "card-3a", name: "", avatar: "", ready: false },
			{ id: "card-3b", name: "", avatar: "", ready: false },
			{ id: "card-3c", name: "", avatar: "", ready: false },
			{ id: "card-3d", name: "", avatar: "", ready: false },
			{ id: "card-2a", name: "", avatar: "", ready: false },
			{ id: "card-2b", name: "", avatar: "", ready: false },
			{ id: "card-1a", name: "", avatar: "", ready: false }
		],
		ranking: [0,0,0,0]
	};

	constructor () {
		this.messageFrame = document.getElementById("messageFrame");
		this.gameFrame = document.getElementById("gameFrame");
		this.tournamentFrame = document.getElementById("tournamentFrame");
		this.setupEvents();
	}

	public start(): void {
		this.matchMakerConnector = new MatchMakerConnector(this);
	}

	public updateState(data: any): void {
		this.tournamentState = data;
		this.hidePlayfield();
		this.updateCards();
	}

	private setupEvents(): void {
		const buttons = document.querySelectorAll('.readyButton');

		buttons.forEach(btn => {
			(btn as HTMLButtonElement).addEventListener('click', () => {
				(btn as HTMLButtonElement).disabled = true;
				this.matchMakerConnector.sendReadyState();
			});
		});
	}

	private updateCards(): void {
		for (const c of this.tournamentState.cards) {
			const card: any = document.getElementById(c.id);
			const avatar: any = card?.querySelector('.avatar');
			const name: any = card?.querySelector('.name');
			const img = avatar?.querySelector('img');
			const btn = card?.querySelector('button');

			if (name)
				name.textContent = c.name;
			if (img) {
				img.src = c.avatar;
				img.classList.remove('hidden');
				img.classList.add('block');
			}
			if (btn) {
				if (c.ready) {
					btn.classList.remove('bg-pink-600/15');
					btn.classList.add('bg-green-400/30');
				}
				else {
					btn.classList.remove('bg-green-400/30');
					btn.classList.add('bg-pink-600/15');
				}
			}
		}
	}

	public enableButtons(): void {
		const buttons = document.querySelectorAll('.readyButton');

		buttons.forEach((btn, idx) => {
			const pair = btn?.parentElement?.parentElement;

			if (this.tournamentState.phase === Phase.SEMIFINALS && pair?.getAttribute("id") == "pair-2ab")
				return;
			
			btn.classList.remove('hidden');
			btn.classList.add('ma');
			(btn as HTMLButtonElement).disabled = true;
			if (btn === this.getUserButton())
				(btn as HTMLButtonElement).disabled = false;
		});
	}

	private getUserButton(): HTMLButtonElement {
		let cardId!: string;
		let card!: any;
		let button!: any;

		for (const c of this.tournamentState.cards) {
			if (c.name == this.userName) {
				cardId = c.id;
				break;
			}
		}

		card = document.getElementById(cardId);
		button = card.querySelector('button');
		return (button);
	}
	
	public displayPlayfield(): void {
		this.messageFrame?.classList.add('hidden');
		this.messageFrame?.classList.remove('flex', 'block', 'inline-block', 'flexbox');

		this.gameFrame?.classList.remove('hidden');
		this.gameFrame?.classList.add('block');

		this.tournamentFrame?.classList.add('hidden');
		this.tournamentFrame?.classList.remove('block');
		
	}

	public hidePlayfield(): void {
		this.messageFrame?.classList.add('hidden');
		this.messageFrame?.classList.remove('flex');

		this.gameFrame?.classList.add('hidden');
		this.gameFrame?.classList.remove('block');

		this.tournamentFrame?.classList.remove('hidden');
		this.tournamentFrame?.classList.add('block');

		if (this.tournamentState.phase === Phase.FINALS) {
			const pair3cd = document.getElementById("pair-3cd") as HTMLElement | null;
			if (pair3cd) {
				pair3cd.classList.add('hidden');
				pair3cd.classList.remove('block', 'flex', 'inline-block');
			}
		}
		else if (this.tournamentState.phase === Phase.COMPLETED){

			let selectElements: Set<HTMLElement | null> = new Set<HTMLElement | null>();
			
			selectElements.add(document.getElementById("card-3b"));
			selectElements.add(document.getElementById("card-2b"));

			let buttons = document.getElementsByClassName("readyButton");
			for (const b of buttons) {
				selectElements.add(b as HTMLElement);
			}

			let vsTags = document.getElementsByClassName("vs");
			for (const t of vsTags) {
				selectElements.add(t as HTMLElement);
			}

			for (const e of selectElements) {
				if (e) {
					e.classList.add('hidden');
					e.classList.remove('block', 'flex', 'inline-block');
				}
			}
		}
	}
	
	public setUserName(userName: string): void {
		this.userName = userName;
	}

	public cancelTournament(userName: string): void {
		console.log(`Info: User ${userName} disconnected. Tournament was cancelled`);
		this.messageFrame?.classList.remove('hidden');
		this.messageFrame?.classList.add('flex');
		
		this.gameFrame?.classList.add('hidden');
		this.gameFrame?.classList.remove('block');
		
		this.tournamentFrame?.classList.add('hidden');
		this.tournamentFrame?.classList.remove('block');
		

		if (this.messageFrame) {
			this.messageFrame.textContent = `User ${userName} disconnected. Tournament was cancelled`;
		}
	}

	public cleanUp = () => {
		if (this.matchMakerConnector)
			this.matchMakerConnector.closeConnection();
	}
}