import {createWebSocket, closeWebSocket, ws, dictionaryWs} from './websocket.js';
import { startAnimation } from './background.js'


export async function init() {
	//TODO uncomment
    startAnimation();
}