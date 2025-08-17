let abortController = new AbortController();
let ws: WebSocket | null = null;
let playField: HTMLCanvasElement;
let ctx;
let scoreElement:  HTMLElement;

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
	scoreElement.textContent = `${gameState.score[0]} - ${gameState.score[1]}`;
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
	(ctx!).fillText(`Winner: Player ${endGameData.winnerUID}`, 
		playField.width/2, playField.height/2 + 50);

	// Botón de nueva partida
	const buttonY = playField.height/2 + 120;
	(ctx!).fillStyle = '#4CAF50';
	(ctx!).fillRect(playField.width/2 - 100, buttonY, 200, 50);
	
	(ctx!).fillStyle = 'white';
	(ctx!).font = '24px monospace';
	(ctx!).fillText('New Game', playField.width/2, buttonY + 32);

	// Añadir listener para el click en el botón
	const wrapper = document.createElement('div');
	wrapper.classList.add('container', 'mx-auto', 'p-4', 'md:p-');
	wrapper.id = 'home-button-div';
	const root = document.getElementById('root');
	const button = document.createElement('button');
	button.classList.add('text-left', 'nav-link', 'bg-blue-600', 'hover:bg-blue-700', 'text-white', 'font-semibold', 'py-2', 'px-4', 'rounded-lg', 'transition-colors', 'duration-300', 'whitespace-nowrap');
	button.textContent = 'Home';
	button.setAttribute('data-path', '/');
	wrapper.appendChild(button);
	if (root)
		root.prepend(wrapper);
	playField.addEventListener('click', handleNewGameClick, { signal: abortController.signal });
}

// Función para manejar el click en "New Game"
function handleNewGameClick(event: MouseEvent) {
	const rect = playField.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	
	// Comprobar si el click fue en el botón
	if (x >= playField.width/2 - 100 && x <= playField.width/2 + 100 &&
		y >= playField.height/2 + 120 && y <= playField.height/2 + 170) {
		
		// Eliminar el listener para evitar múltiples clicks
		playField.removeEventListener('click', handleNewGameClick);
		
		// Crear nueva conexión en lugar de usar la antigua (que está cerrada)
		setupWebSocket();
		(document.getElementById('home-button-div')!).remove();

	}
}

function handleStartClick(event: MouseEvent) {
	const rect = playField.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	
	const buttonY = playField.height/2 + 50;
	if (x >= playField.width/2 - 100 && x <= playField.width/2 + 100 &&
		y >= buttonY && y <= buttonY + 50) {
		
		playField.removeEventListener('click', handleStartClick);
		gameStarted = true;
		setupWebSocket();
	}
}

function handleKeyDown(event: KeyboardEvent)
{
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
}

function handleKeyUp(event: KeyboardEvent)
{
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
}

function setup()
{
	// control
	abortController.abort(); 
    abortController = new AbortController();
	document.addEventListener('keydown', handleKeyDown, { signal: abortController.signal });

	document.addEventListener('keyup', handleKeyUp, { signal: abortController.signal });
}

export function showStartScreen() {

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

	// Botón de inicio
	const buttonY = playField.height/2 + 50;
	(ctx!).fillStyle = '#4CAF50';
	(ctx!).fillRect(playField.width/2 - 100, buttonY, 200, 50);
	
	(ctx!).fillStyle = 'white';
	(ctx!).font = '24px monospace';
	(ctx!).fillText('Start Game', playField.width/2, buttonY + 32);

	// Listener para el botón
	setup();
	playField.addEventListener('click', handleStartClick, { signal: abortController.signal });
}

export function cleanup()
{
	console.log("Cleanup function called...")
	abortController.abort();
	if (ws)
	{
			ws.onopen = null;
			ws.onmessage = null;
			ws.onerror = null;
			ws.onclose = null;
			ws.close();
			ws = null;
	}
}

export {};