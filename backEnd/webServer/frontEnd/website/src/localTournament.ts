let abortController = new AbortController();
let ws: WebSocket | null = null;
let playField: HTMLCanvasElement;
let ctx;
let scoreElement:  HTMLElement;
let name1: string;
let name2: string;
let finalist1: string;
let finalist2: string;
let winner: string;
let matchCount: number;

let alias1: string;
let alias2: string;
let alias3: string;
let alias4: string;

let PADDLE_WIDTH = 64;
let PADDLE_HEIGHT = 256;
let BALL_RADIUS = 32;

let gameActive;
let gameStarted; // Nueva variable para controlar primera pantalla

interface Ball {
	x: number;
	y: number;
}

interface Paddle {
	x: number;
	y: number;
}

interface GameState {
	ball: Ball;
	paddles: Paddle[];
	score: [number, number];
}

interface SetupResponse extends GameState {
	paddleWidth: number;
	paddleHeight: number;
	ballRadius: number;
}

interface EndGameData {
	score: [number, number];
	winnerUID: number;
}

// Estado inicial
let gameState: GameState = {
	ball: { x: 0, y: 0 },
	paddles: [
		{ x: 0, y: 0 },
		{ x: 0, y: 0 }
	],
	score: [0, 0]
};

function setupWebSocket() {
	ws = new WebSocket(`wss://${window.location.hostname}:8443/serverpong/front/get/local`);

	ws.onopen = () => {
		console.log('Conectado al servidor');
		requestGameSetup();
	};

	ws.onmessage = (event: MessageEvent) => {
		const data = JSON.parse(event.data);
		switch(data.type) {
			case 'setupResponse':
				handleSetupResponse(data);
				break;
			case 'update':
				gameState = data;
				drawGame();
				break;
			case 'endGame':
				gameActive = false;
				showEndGameScreen(data);
				break;
		}
	};

	ws.onclose = () => {
		console.log('Desconectado del servidor');
	};

	ws.onerror = (error) => {
		console.error('Error en WebSocket:', error);
	};
}

function requestGameSetup() {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify({ type: 'setupRequest' }));
	}
}

function handleSetupResponse(data: any) {
	// Actualizar dimensiones globales
	PADDLE_WIDTH = data.paddleWidth;
	PADDLE_HEIGHT = data.paddleHeight;
	BALL_RADIUS = data.ballRadius;

	// Actualizar estado inicial
	gameState.ball = data.ballPos;
	gameState.paddles = data.paddlesPos;
	gameState.score = data.score;

	// Iniciar juego
	startNewGame();
}

function startNewGame() {
	gameActive = true;
	if (ws?.readyState === WebSocket.OPEN)
	{
		ws.send(JSON.stringify({ 
			type: 'newGame',
			player1UID: 1,
			player2UID: 2
		}));
	}
}

function drawGame() {
	// playField
	(ctx!).fillStyle = '#1a1a1a';
	(ctx!).fillRect(0, 0, playField.width, playField.height);

	// paddles
	(ctx!).fillStyle = 'white';
	gameState.paddles.forEach(paddle => {
		(ctx!).fillRect(
			paddle.x,
			paddle.y,
			PADDLE_WIDTH,
			PADDLE_HEIGHT
		);
	});

	// vall
	(ctx!).beginPath();
	(ctx!).arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
	(ctx!).fill();

	// score
	scoreElement.textContent = `${name1} ${gameState.score[0]} - ${gameState.score[1]} ${name2}` ;
}


function showEndGameScreen(endGameData: EndGameData) {
	// Limpiar canvas
	(ctx!).fillStyle = '#1a1a1a';
	(ctx!).fillRect(0, 0, playField.width, playField.height);

	// Mostrar resultados
	(ctx!).fillStyle = 'white';
	(ctx!).font = '48px monospace';
	(ctx!).textAlign = 'center';
	
	// Título
	(ctx!).fillText('Game Over!', playField.width/2, playField.height/3);
	
	// Puntuación final
	(ctx!).font = '36px monospace';
	(ctx!).fillText(`Final Score: ${endGameData.score[0]} - ${endGameData.score[1]}`, 
		playField.width/2, playField.height/2);
	
	// Ganador
	if (endGameData.winnerUID == 1)
	{
		(ctx!).fillText(`Winner: ${name1}`, 
			playField.width/2, playField.height/2 + 50);
		if (matchCount == 1)
			finalist1 = name1;
		if (matchCount == 2)
			finalist2 = name1;
		if (matchCount == 3)
			winner = name1;
	}
	else
	{
		(ctx!).fillText(`Winner: ${name2}`, 
			playField.width/2, playField.height/2 + 50);
		if (matchCount == 1)
			finalist1 = name2;
		if (matchCount == 2)
			finalist2 = name2;
		if (matchCount == 3)
			winner = name2;
	}

	// Botón de nueva partida
	const buttonY = playField.height/2 + 120;
	(ctx!).fillStyle = '#4CAF50';
	(ctx!).fillRect(playField.width/2 - 100, buttonY, 200, 50);
	
	(ctx!).fillStyle = 'white';
	(ctx!).font = '24px monospace';
	(ctx!).fillText('Continue', playField.width/2, buttonY + 32);

	// Añadir listener para el click en el botón
	playField.addEventListener('click', handleNewContinueClick);
}

// Función para manejar el click en "New Game"
function handleNewContinueClick() {
	switch(matchCount) {
		case 1:
			secondGame();
			break;
		case 2:
			finalGame();
			break;
		case 3:
			endTournamentScreen();
			break;
	}

}


function setup()
{
	// control
	abortController.abort(); 
    abortController = new AbortController();
	document.addEventListener('keydown', (event: KeyboardEvent) => {
		let input = { type: 'input', playerId: 0, direction: 'stop' };
		
		switch(event.key) {
			case 'w':
				input.direction = 'up';
				input.playerId = 0;
				break;
			case 's':
				input.direction = 'down';
				input.playerId = 0;
				break;
			case 'ArrowUp':
				input.direction = 'up';
				input.playerId = 1;
				break;
			case 'ArrowDown':
				input.direction = 'down';
				input.playerId = 1;
				break;
		}
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(input));
		}
	});

	document.addEventListener('keyup', (event: KeyboardEvent) => {
		let input = { type: 'input', playerId: 0, direction: 'stop' };
		
		switch(event.key) {
			case 'w':
			case 's':
				input.playerId = 0;
				break;
			case 'ArrowUp':
			case 'ArrowDown':
				input.playerId = 1;
				break;
		}
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(input));
		}
	});
}

function showStartScreen() {

	console.log("Main function showStartScreen is being executed!");
	ws = null;
	playField = document.getElementById('playField') as HTMLCanvasElement;
	if (!playField) {
		throw new Error("Fatal Error: playField element not found in DOM.");
	}
	ctx = playField.getContext('2d');
	if (!ctx) {
		throw new Error("Fatal Error: Canvas 2D context could not be created.");
	}
	scoreElement = document.getElementById('score') as HTMLElement;
	if (!scoreElement) {
		throw new Error("Fatal Error: scoreElement element not found in DOM.");
	}

	PADDLE_WIDTH = 64;
	PADDLE_HEIGHT = 256;
	BALL_RADIUS = 32;

	gameActive = false;
	gameStarted = false;

	console.log("Game Started:", gameStarted, "Game Active:", gameActive);

	console.log("ctx: ", ctx);
	if (ctx)
		console.log("True");
	else
		console.log("False");

	// Fondo
	(ctx!).fillStyle = '#1a1a1a';
	(ctx!).fillRect(0, 0, playField.width, playField.height);

	// Título
	(ctx!).fillStyle = 'white';
	(ctx!).font = '48px monospace';
	(ctx!).textAlign = 'center';
	(ctx!).fillText('PONG', playField.width/2, playField.height/3);

	setup();
	gameStarted = true;
	setupWebSocket();
}


async function loadDOM()
{
	let response: Response = await fetch("/components/localgame", {
		method: 'GET',
		credentials: 'include'
	});
	if (response.ok)
	{
		let data: string = await response.text();
		//console.log("html:", data);
		const root = document.getElementById('root');
		if (root) {
			root.innerHTML = data;
		} else {
			console.error('Root element not found');
		}
	}
}

async function handleInput()
{
		alias1 = (document.getElementById("alias-1") as HTMLInputElement)?.value || "player 1";
		alias2 = (document.getElementById("alias-2") as HTMLInputElement)?.value || "player 2";
		alias3 = (document.getElementById("alias-3") as HTMLInputElement)?.value || "player 3";
		alias4 = (document.getElementById("alias-4") as HTMLInputElement)?.value || "player 4";
		await loadDOM();
		name1 = alias1;
		name2 = alias2;
		showStartScreen();
}

export async function init ()
{
	cleanup();
	const response: Response = await fetch("/components/input_local", {
		method: 'GET'
	});
	let data: string = await response.text();
	document.querySelector('#input-tournamnet')!.innerHTML = data;
	matchCount = 1;
	let startButton = document.getElementById("start-button") as HTMLElement;
	startButton.textContent = "Start first match"
	if (startButton)
	{
		startButton.addEventListener('click', handleInput)
	}
	//fetch hmtl of tournament.
	//Let user input alias names, if not ==> default names (player 1, player 2, player 3 and player 4).
	//When start is pressed. local game script is executed with aliases as the input. How? Import? Yes.
	//When game is over, store the winner's alias.
	//Second game
	//Third game
	//Final screen + back home button.
}

async function secondGame()
{
	matchCount = 2;
	let response: Response = await fetch("/components/local_tournament", {
		method: 'GET'
	});
	let data: string = await response.text();
	document.querySelector('#root')!.innerHTML = data;

	const response2: Response = await fetch("/components/players_local", {
		method: 'GET'
	});
	let data2: string = await response2.text();
	document.querySelector('#input-tournamnet')!.innerHTML = data2;

	document.getElementById("player-1-name")!.textContent = alias1;
	document.getElementById("player-2-name")!.textContent = alias2;
	document.getElementById("player-3-name")!.textContent = alias3;
	document.getElementById("player-4-name")!.textContent = alias4;
	document.getElementById("finalist-1")!.textContent = finalist1;

	let startButton = document.getElementById("start-button") as HTMLElement;
	startButton.textContent = "Start second match"
	if (startButton)
	{
			startButton.addEventListener('click', async () => {
				await loadDOM();
				name1 = alias3;
				name2 = alias4;
				showStartScreen();
			})
	}
}

async function finalGame()
{
	matchCount = 3;
	let response: Response = await fetch("/components/local_tournament", {
		method: 'GET'
	});
	let data: string = await response.text();
	document.querySelector('#root')!.innerHTML = data;

	const response2: Response = await fetch("/components/players_local", {
		method: 'GET'
	});
	let data2: string = await response2.text();
	document.querySelector('#input-tournamnet')!.innerHTML = data2;

	document.getElementById("player-1-name")!.textContent = alias1;
	document.getElementById("player-2-name")!.textContent = alias2;
	document.getElementById("player-3-name")!.textContent = alias3;
	document.getElementById("player-4-name")!.textContent = alias4;
	document.getElementById("finalist-1")!.textContent = finalist1;
	document.getElementById("finalist-2")!.textContent = finalist2;

	let startButton = document.getElementById("start-button") as HTMLElement;
	startButton.textContent = "Start final match"
	if (startButton)
	{
			startButton.addEventListener('click', async () => {
				await loadDOM();
				name1 = finalist1;
				name2 = finalist2;
				showStartScreen();
			})
	}
}

async function endTournamentScreen()
{
	matchCount = 3;
	let response: Response = await fetch("/components/local_tournament", {
		method: 'GET'
	});
	let data: string = await response.text();
	document.querySelector('#root')!.innerHTML = data;

	const response2: Response = await fetch("/components/players_local", {
		method: 'GET'
	});
	let data2: string = await response2.text();
	document.querySelector('#input-tournamnet')!.innerHTML = data2;

	document.getElementById("player-1-name")!.textContent = alias1;
	document.getElementById("player-2-name")!.textContent = alias2;
	document.getElementById("player-3-name")!.textContent = alias3;
	document.getElementById("player-4-name")!.textContent = alias4;
	document.getElementById("finalist-1")!.textContent = finalist1;
	document.getElementById("finalist-2")!.textContent = finalist2;
	document.getElementById("finalist-2")!.textContent = finalist2;
	document.getElementById("winner-name")!.textContent = winner;

	let startButton = document.getElementById("start-button") as HTMLElement;
	startButton.remove();
	const wrapper = document.getElementById('return-to-home-button');
	if (wrapper) {
	const button = document.createElement('button');
	button.classList.add('nav-link', 'bg-green-600', 'hover:bg-green-700', 'text-white', 'font-bold', 'text-xl', 'py-3', 'px-8', 'rounded-lg', 'transition-colors', 'duration-300', 'min-w-[250px]');
	button.textContent = 'Home';
	button.setAttribute('data-path', '/');

	wrapper.appendChild(button);
	}
}

function cleanup()
{
	abortController.abort();
	if (ws)
	{
		// if (ws.readyState === WebSocket.OPEN)
		// {
			ws.onopen = null;
			ws.onmessage = null;
			ws.onerror = null;
			ws.onclose = null;
			ws.close();
			ws = null;
		// }
	}
}