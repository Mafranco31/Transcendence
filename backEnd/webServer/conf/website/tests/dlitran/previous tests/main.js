//import Fastify from './path/sin/extension'
//import * as libreria from './path'
//import {router, gjjh} from './spa' 

let ws;
const playField = document.getElementById('playField');
const ctx = playField.getContext('2d');
const scoreElement = document.getElementById('score');

let PADDLE_WIDTH = 64;
let PADDLE_HEIGHT = 256;
let BALL_RADIUS = 32;

let gameActive = false;
let gameStarted = false;  // Nueva variable para controlar primera pantalla

// Estado inicial
let gameState = {
	ball: { x: 0, y: 0 },
	paddles: [
		{ x: 0, y: 0 },
		{ x: 0, y: 0 }
	],
	score: [0, 0]
};

function setupWebSocket() {
	ws = new WebSocket(`wss://${window.location.hostname}:8443/serverpong/front/get/pong`);
		ws.onopen = () => {
		console.log('Conectado al servidor');
		requestGameSetup();
	};

	ws.onmessage = (event) => {
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
	ws.send(JSON.stringify({ type: 'setupRequest' }));
}

function handleSetupResponse(data) {
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
	ws.send(JSON.stringify({ 
		type: 'newGame',
		player1UID: 11,
		player2UID: 22
	}));
}

function drawGame() {
	// playField
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, 0, playField.width, playField.height);

	// paddles
	ctx.fillStyle = 'white';
	gameState.paddles.forEach(paddle => {
		ctx.fillRect(
			paddle.x,
			paddle.y,
			PADDLE_WIDTH,
			PADDLE_HEIGHT
		);
	});

	// vall
	ctx.beginPath();
	ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
	ctx.fill();

	// score
	scoreElement.textContent = `${gameState.score[0]} - ${gameState.score[1]}`;
}

// control
document.addEventListener('keydown', (event) => {
	let input = { type: 'input', playerSlot: 0, direction: 'stop' };
		
	switch(event.key) {
		case 'w':
			input.direction = 'up';
			input.playerSlot = 0;
			break;
		case 's':
			input.direction = 'down';
			input.playerSlot = 0;
			break;
		case 'ArrowUp':
			input.direction = 'up';
			input.playerSlot = 1;
			break;
		case 'ArrowDown':
			input.direction = 'down';
			input.playerSlot = 1;
			break;
	}
			
	ws.send(JSON.stringify(input));
});

document.addEventListener('keyup', (event) => {
	let input = { type: 'input', playerSlot: 0, direction: 'stop' };
	
	switch(event.key) {
		case 'w':
		case 's':
			input.playerSlot = 0;
			break;
		case 'ArrowUp':
		case 'ArrowDown':
			input.playerSlot = 1;
			break;
	}
			
	ws.send(JSON.stringify(input));
});

function showEndGameScreen(endGameData) {
	// Limpiar canvas
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, 0, playField.width, playField.height);

	// Mostrar resultados
	ctx.fillStyle = 'white';
	ctx.font = '48px monospace';
	ctx.textAlign = 'center';
			
	// Título
	ctx.fillText('Game Over!', playField.width/2, playField.height/3);
			
	// Puntuación final
	ctx.font = '36px monospace';
	ctx.fillText(`Final Score: ${endGameData.score[0]} - ${endGameData.score[1]}`, 
	playField.width/2, playField.height/2);
		
	// Ganador
	ctx.fillText(`Winner: Player ${endGameData.winnerUID}`, 
		playField.width/2, playField.height/2 + 50);

	// Botón de nueva partida
	const buttonY = playField.height/2 + 120;
	ctx.fillStyle = '#4CAF50';
	ctx.fillRect(playField.width/2 - 100, buttonY, 200, 50);
			
	ctx.fillStyle = 'white';
	ctx.font = '24px monospace';
	ctx.fillText('New Game', playField.width/2, buttonY + 32);

	// Añadir listener para el click en el botón
	playField.addEventListener('click', handleNewGameClick);
}

// Función para manejar el click en "New Game"
function handleNewGameClick(event) {
	const rect = playField.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
			
			// Comprobar si el click fue en el botón
	if (x >= playField.width/2 - 100 && x <= playField.width/2 + 100 &&
		y >= playField.height/2 + 120 && y <= playField.height/2 + 170) {
				
				// Remover el listener para evitar múltiples clicks
		playField.removeEventListener('click', handleNewGameClick);
				
				// Crear nueva conexión en lugar de usar la antigua (que está cerrada)
		setupWebSocket();
	}
}

function showStartScreen() {
			// Fondo
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, 0, playField.width, playField.height);

			// Título
	ctx.fillStyle = 'white';
	ctx.font = '48px monospace';
	ctx.textAlign = 'center';
	ctx.fillText('PONG', playField.width/2, playField.height/3);

			// Botón de inicio
	const buttonY = playField.height/2 + 50;
	ctx.fillStyle = '#4CAF50';
	ctx.fillRect(playField.width/2 - 100, buttonY, 200, 50);
			
	ctx.fillStyle = 'white';
	ctx.font = '24px monospace';
	ctx.fillText('Start Game', playField.width/2, buttonY + 32);

			// Listener para el botón
	playField.addEventListener('click', handleStartClick);
}

function handleStartClick(event) {
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

function showLogInScreen() {
	loginForm = document.getElementById("loginForm");
	SignUpButton = document.getElementById("SignUpButton");

	loginForm.addEventListener('submit', async function (e) {
		e.preventDefault();
		const name = document.getElementById('name').value;
		const pass = document.getElementById('pass').value;

		const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/post/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify({name, pass})
		});

		if (response.ok) {
			loginForm.hidden = !loginForm.hidden;
			showStartScreen();
		}
	})

	SignUpButton.addEventListener('click', )
}

// if logged in
//else
showLogInScreen();