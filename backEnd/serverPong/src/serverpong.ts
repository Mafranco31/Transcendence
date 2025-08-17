import Fastify from 'fastify';
import { WebSocket } from 'http';
import * as EndPoints from './endpoint'
import { StandardGameManager } from './pongEngine';

export const	P1 = 0;
export const	P2 = 1;
export const	TICK_RATE = 60;
export const	TICK_INTERVAL = 1000 / TICK_RATE;
export const	PLAYFIELD_SIZE = {width: 1280, height: 720};
export const	PLAYFIELD_POS = {x: 0, y: 0}
export const	BALL_SPEED = 600;
export const	BALL_RADIUS = 32;
export const	PADDLE_SPEED = 1000;
export const	PADDLE_WIDTH = 64;
export const	PADDLE_HEIGHT = 256;
export const	PADDLE_MARGIN = 32;
export const	MAX_SCORE = 3;

const server = Fastify({
	logger: true
});

export let standardGameManager: StandardGameManager;

function setEndPoints(): void {

	new EndPoints.PostNewMatch('/post/match', 'Error obtaining match endpoint');

	new EndPoints.GetNewGame('/serverpong/front/get/game', 'Error obtaining online pong endpoint');

	new EndPoints.DeleteOngoingMatch('/delete/match', 'Error deleting ongoing match');

	new EndPoints.GetLocalGame('/serverpong/front/get/local', 'Error creating local game');

	EndPoints.Endpoint.enableAll(server);
}

async function start() {

	await server.register(require('@fastify/websocket'));

	standardGameManager = new StandardGameManager();
	setEndPoints();

	console.log("Enpoints registered:\n" + server.printRoutes());

	try {
		await server.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}

start();
