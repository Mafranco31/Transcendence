import { PongGame } from './pongGame.js';
import { PongTournament } from './pongTournament.js';
import {createWebSocket, closeWebSocket} from './websocket.js';

let currentCleanupFunction: any = null;

console.log('SPA loaded');

interface Page {
	path: string;
	view: () => Promise<void>;
}

async function methodNotAllowed()
{
	const response: Response = await fetch("/components/405", {
		method: 'GET'
	});
	let data: string = await response.text();
	document.querySelector('#root')!.innerHTML = data;
}

const routes: Page[] = [

	{
		path: "/localtournament",
		view: async () => {
			try {
				let response: Response = await fetch("/components/local_tournament", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);
					//console.log("html:", data);
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					} else {
						console.error('Root element not found');
					}
					import(`./localTournament.js`)
					.then((module) => {		
						module.init()
					});
				}
				else {
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},

	{
		path: "/localgame",
		view: async () => {
			try {
				let response: Response = await fetch("/components/localgame", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);
					//console.log("html:", data);
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					} else {
						console.error('Root element not found');
					}
					import(`./localGame.js`)
					.then((module) => {		
						module.showStartScreen();
						currentCleanupFunction = module.cleanup;
					});
				}
				else {
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},

	{
		path: "/game",
		view: async () => {
			try {
				let response: Response = await fetch("/components/game", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);

					let data: string = await response.text();
					//console.log("html:", data);
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
						let newGame = new PongGame();
						newGame.start()
						currentCleanupFunction = newGame.cleanUp;
					} else {
						console.error('Root element not found');
					}
				}
				else {
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},

	{
		path: "/tournament",
		view: async () => {
			try {

				let response: Response = await fetch("/components/tournament", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
						let newTournament = new PongTournament();
						newTournament.start();
						currentCleanupFunction = newTournament.cleanUp;

					} else {
						console.error('Root element not found');
					}
				}
				else {
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},

	{
		path: "/",
		view: async () => {
			try {
				let response: Response = await fetch("/components/home", {
					method: 'GET',
					credentials: 'include'
				});
				//console.log("/home request sent.");
				if (response.ok)
				{
					let data: string = await response.text();
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);
					//console.log("html:", data);
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					} else {
						console.error('Root element not found');
					}
					import(`./home.js`)
					.then((module) => {		
						module.init();
					});
				}
				else {
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},
	{
		path: "/login",
		view: async () => {
			try {
				let response: Response = await fetch("/access/login", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					}
					const existingScript = document.querySelector("script[src*='/dist/login.js']");
					//console.log(existingScript);
					if (existingScript) {
						//console.log('Found and removed existing script:', existingScript);
						existingScript.remove();
					}

					const newScript = document.createElement('script');
					newScript.src = `./dist/login.js?cb=${Date.now()}`;
					newScript.type = 'module';
					newScript.async = true;
					document.body.appendChild(newScript);
				}
				else
				{
					history.pushState(null, '', "/");
					router();
					return;
				}
				//import("");
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},
	{
		path: "/signin",
		view: async () => {
			try {
				let response: Response = await fetch("/access/signin", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					import(`./signin.js`)
						.then((module) => {		
							module.init();
						});
					}
				}
				else
				{
					history.pushState(null, '', "/");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},
	{
		path: "/profile",
		view: async () => {
			try {
				let response: Response = await fetch("/components/profile", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					let data: string = await response.text();
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
						import(`./profile.js`)
						.then((module) => {		
							module.loadProfile();
						});

					} else {
						console.error('Root element not found');
					}
				}
				else
				{
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},
	{
		path: "/friend_profile",
		view: async () => {
			try {
				const params = new URLSearchParams(window.location.search);
				const friendId = params.get("friendId");
				if (!friendId) {
					console.error("Friend ID is missing");
					return;
				}
				
				console.log("friendId:", friendId);
				let response: Response = await fetch("/components/friend_profile", {
					method: 'GET',
					credentials: 'include'
				});
				if (response.ok)
				{
					const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
						method: 'GET',
						credentials: 'include'
					});
					const sessionData = await sessionResponse.json();
					const id = sessionData.name;
					createWebSocket(id);
					let data: string = await response.text();
					const root = document.getElementById('root');
					if (root) {
						root.innerHTML = data;
					import(`./friend_profile.js`)
						.then((module) => {		
							module.init(friendId);
						});
					}
				}
				else
				{
					//await methodNotAllowed();
					history.pushState(null, '', "/login");
					router();
					return;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	},
	{
		path: "/logout",
		view: async () => {
			try
			{
				let response: Response = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/post/logout`, {
					method: 'POST',
					credentials: 'include'
				});
				closeWebSocket();

				//window.location.href="/login";
				//console.log("go login");
				history.pushState(null, '', "/login");
				//console.log("before router");
				router();
				//console.log("After router");
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.error("Error:", error.message);
				}
				else
				{
					console.error("Unknown error.");
				}
			}
		}
	}
]

export const router = async () => {
	const path = location.pathname;
	const match = routes.find(route => route.path == path);
	const root = document.getElementById('root');
	if (root) {
		root.innerHTML = '';
	}
	if (typeof currentCleanupFunction === 'function') {
        currentCleanupFunction();
    }
	currentCleanupFunction = null;
	if (match)
	{
		console.log("match: ", match);
		await match.view();
		console.log("finished");
	}
	else {
		const response: Response = await fetch("/components/404", {
			method: 'GET'
		});
		let data: string = await response.text();
		document.querySelector('#root')!.innerHTML = data;
	}
}

document.addEventListener('DOMContentLoaded', () => {
document.addEventListener('click', e => {
	const target = e.target as HTMLElement;

	if (target.matches('.nav-link')) {
		e.preventDefault();
		const href = target.getAttribute('data-path')!;

		history.pushState(null, '', href);
		console.log("href: ", href);
		
		router();
	}
});
});

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', router);

