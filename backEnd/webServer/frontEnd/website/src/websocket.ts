export let ws: WebSocket | null = null;

type BoolDictionary = {
	[key: string]: boolean;
};

export let dictionaryWs: BoolDictionary = {};

export async function resetDictionaryWs() {
	const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/userfriendships`, {
		method: 'GET',
		credentials: 'include'
	});
	if (!response.ok) {
		console.log("Error getting friends");
	}

	const data = await response.json(); // ex: [{ pseudo: 'eqwq', id: 2, status: true }]
	console.log(data)
	data.forEach((friend: any) => {
		dictionaryWs[friend.id] = friend.status
	});
}

export async function createWebSocket(userId: string) : Promise<WebSocket | null> {
	if (ws) {
		console.log("WebSocket already exists.");
		return ws;
	}

	resetDictionaryWs();

	ws = new WebSocket(`wss://${window.location.hostname}:8443/userauthentication/front/ws/status?userId=${userId}`);

	ws.onopen = () => {
		console.log("WebSocket connected → user online");
	};

	// ws.onmessage = (event) => {
	// 	const data = JSON.parse(event.data);
	// 	dictionaryWs[data.id] = data.status;
	// 	console.log(`Message received: ${data.id} is ${data.status ? 'online' : 'offline'}`);
	// };

	ws.onclose = () => {
		console.log("WebSocket closed → user offline");
	};

	return ws;
}

export function closeWebSocket() {
	if (ws) {
		ws.close();
		ws = null;
		console.log("WebSocket closed");
	}
}

export function modifyDictionaryWs(id: string, status: boolean): void {
	dictionaryWs[id] = status;
}

export function WsFriendStatus(id: string): boolean {
	return dictionaryWs[id];
}