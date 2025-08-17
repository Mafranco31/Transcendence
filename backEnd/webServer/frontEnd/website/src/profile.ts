import { error } from 'console';
import { router } from './router.js';
import {createWebSocket, closeWebSocket, modifyDictionaryWs, ws, dictionaryWs, WsFriendStatus, resetDictionaryWs} from './websocket.js';
// async function getProfile(): Promise<Response>
// {

// 	const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
// 		method: 'GET',
// 		credentials: 'include',
// 	});
// 	if (!response.ok)
// 	{
// 		console.log("Erroooor!");
// 	}
// 	let session = await response.json();
// 	const id = session.name;
// 	console.log("Profile:", session);

// 	const profileResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile?id=${id}`, {
// 		method: 'GET',
// 		credentials: 'include'
// 	});

// 	return(profileResponse);
// }

// //let profile: any = getProfile();
// getProfile().then(async profileResponse => {
// 	if (profileResponse.ok) {
// 		const profile = (await profileResponse.json())[0];
// 		console.log(profile.bio);
// 	console.log("hola", profile.pseudo);
// 	}
// });


export async function loadProfile() {

	const deleteAccountButton = document.getElementById('delete-account');
	if (deleteAccountButton)
		deleteAccountButton.addEventListener('click', deleteAccount);

	//console.log("profile is being loaded.");
	const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
	  method: 'GET',
	  credentials: 'include'
	});

	if (!sessionResponse.ok) {
		history.pushState(null, '', "/login");
		router();
		return;
	}

	const sessionData = await sessionResponse.json();
	let id = sessionData.name;

	const ws = await createWebSocket(id);

	if (!ws) {
		console.error("WebSocket creation failed.");
		return;
	} else {
		 ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			modifyDictionaryWs(data.id, data.status);
			console.log(`Message received: ${data.id} is ${data.status ? 'online' : 'offline'}`);
			fetchList('friend-list-accepted', 'friend-template', '/usermanagement/front/get/friendships_accepted');
		};
	}
	// if (ws) {
	// 	ws.onmessage = (event) => {
	// 		const data = JSON.parse(event.data);
	// 		// dictionaryWs[data.id] = data.status;
	// 		if (data.status) {
	// 			console.log(`User ${data.id} online`);
	// 		} else {
	// 			console.log(`User ${data.id} ofline`);
	// 		}
	// 	}
	// }
	

	// // friend status
	// type BoolDictionary = {
	// 	[key: string]: boolean;
	// };

	// let dictionary: BoolDictionary = {};

	// ws = new WebSocket(`wss://${window.location.hostname}:8443/userauthentication/front/ws/status?userId=${id}`);

	// ws.onopen = () => {
	// 	console.log("✅ WebSocket connectée → utilisateur en ligne");
	// };

	// ws.onmessage = (event) => {
	// 	const data = JSON.parse(event.data);
	// 	dictionary[data.id] = data.status;
	// 	if (data.status) {
	// 		console.log(`User ${data.id} online`);
	// 	} else {
	// 		console.log(`User ${data.id} ofline`);
	// 	}
	// };

	// ws.onclose = () => {
	// 	console.log("WebSocket fermée → utilisateur hors ligne");
	// };
	// end friend status


	const profileResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile`, {
	  method: 'GET',
	  credentials: 'include'
	});

	if (profileResponse.ok) {
		const profile = (await profileResponse.json())[0];
		(document.getElementById('pseudo')!).textContent = profile.pseudo || 'Inconnu';
		(document.getElementById('pseudoInput')! as HTMLTextAreaElement).value = profile.pseudo || '';
		(document.getElementById('bio')!).textContent = profile.bio || 'Inconnu';
		(document.getElementById('bioInput')! as HTMLTextAreaElement).value = profile.bio || '';
		(document.getElementById('creationDate')!).textContent = profile.date_creation || 'Inconnue';
		if (profile.avatar)
			(document.getElementById('avatar-box')! as HTMLImageElement).src = profile.avatar;
		else
			(document.getElementById('avatar-box')! as HTMLImageElement).src = `public/avatars/default_avatar.jpg`;
	
	} else {
	  console.error('Erreur lors du chargement du profil');
	}

	// const img = document.createElement('img');
	// 		img.src = `public/avatars/${id}.jpg`;
	// 		//console.log("file name: ", input.files[0].name);
	// 		img.alt = 'My Avatar';
	// 		//img.width = 300; // optional
	// 		let avatarBox = document.getElementById("avatar-box");
	// 		if (avatarBox)
	// 			avatarBox.appendChild(img);

	(document.getElementById('editBioBtn')!).addEventListener('click', () => {
		document.getElementById('bio')!.classList.add('hidden');
		document.getElementById('bioInput')!.classList.remove('hidden');
		document.getElementById('bioInput')!.classList.add('inline');

		document.getElementById('editBioBtn')!.classList.add('hidden');
		document.getElementById('saveBioBtn')!.classList.remove('hidden');
		document.getElementById('saveBioBtn')!.classList.add('inline');

	});

	(document.getElementById('saveBioBtn')!).addEventListener('click', async () => {
		const newBio: string = (document.getElementById('bioInput')! as HTMLTextAreaElement).value;
	
		const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/put/modify_bio`, {
		  method: 'PATCH',
		  credentials: 'include',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ bio: newBio })
	});
	
	if (response.ok) {
		(document.getElementById('bio')!).textContent = newBio;
		(document.getElementById('errorBioMessage')!).classList.remove('text-red-500');
		(document.getElementById('errorBioMessage')!).classList.add('text-green-500');
		(document.getElementById('errorBioMessage')!).textContent = 'Bio updated successfully.';
	  } else {
		const errorData = await response.json();
		console.error('Error updating bio: ', errorData.error);
		(document.getElementById('errorBioMessage')!).classList.remove('text-green-500');
		(document.getElementById('errorBioMessage')!).classList.add('text-red-500');
		(document.getElementById('errorBioMessage')!).textContent = errorData.error || 'Error updating bio.';
	  }
	
		document.getElementById('bio')!.classList.remove('hidden');
		document.getElementById('bio')!.classList.add('inline');

		document.getElementById('bioInput')!.classList.remove('inline');
		document.getElementById('bioInput')!.classList.add('hidden');

		document.getElementById('editBioBtn')!.classList.remove('hidden');
		document.getElementById('editBioBtn')!.classList.add('inline');

		document.getElementById('saveBioBtn')!.classList.remove('inline');
		document.getElementById('saveBioBtn')!.classList.add('hidden');

	});

	//pseudo
	(document.getElementById('editPseudoBtn')!).addEventListener('click', () => {
		document.getElementById('pseudo')!.classList.add('hidden');
		document.getElementById('pseudoInput')!.classList.remove('hidden');
		document.getElementById('pseudoInput')!.classList.add('inline');

		document.getElementById('editPseudoBtn')!.classList.add('hidden');
		document.getElementById('savePseudoBtn')!.classList.remove('hidden');
		document.getElementById('savePseudoBtn')!.classList.add('inline');
  	});

	(document.getElementById('savePseudoBtn')!).addEventListener('click', async () => {
		const newPseudo = (document.getElementById('pseudoInput')! as HTMLTextAreaElement).value;

		const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/put/modify_pseudo`, {
		  method: 'PATCH',
		  credentials: 'include',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ pseudo: newPseudo })
		});

		if (response.ok) {
		  (document.getElementById('pseudo')!).textContent = newPseudo;
		  (document.getElementById('errorPseudoMessage')!).classList.remove('text-red-500');
		  (document.getElementById('errorPseudoMessage')!).classList.add('text-green-500');
		  (document.getElementById('errorPseudoMessage')!).textContent = 'Pseudo updated successfully.';
		} else {
		  const errorData = await response.json();
		  console.error('Error updating pseudo: ', errorData.error);
		  (document.getElementById('errorPseudoMessage')!).classList.remove('text-green-500');
		  (document.getElementById('errorPseudoMessage')!).classList.add('text-red-500');
		  (document.getElementById('errorPseudoMessage')!).textContent = errorData.error || 'Error updating pseudo.';
		}

		document.getElementById('pseudo')!.classList.remove('hidden');
		document.getElementById('pseudo')!.classList.add('inline');

		document.getElementById('pseudoInput')!.classList.remove('inline');
		document.getElementById('pseudoInput')!.classList.add('hidden');

		document.getElementById('editPseudoBtn')!.classList.remove('hidden');
		document.getElementById('editPseudoBtn')!.classList.add('inline');

		document.getElementById('savePseudoBtn')!.classList.remove('inline');
		document.getElementById('savePseudoBtn')!.classList.add('hidden');
	});

	//Show pseudos
	(document.getElementById('showPseudosBtn')!).addEventListener('click', async () => {
		const list = document.getElementById('pseudoList')!;
		const searchInput = (document.getElementById('searchInput') as HTMLInputElement);
		const message = document.getElementById('message')!;
		list.innerHTML = ''; // Clear list
		message.textContent = ''; // Clear message

		// Get the search term (lowercased)
		const searchTerm = searchInput.value.trim().toLowerCase();

		// Fetch pseudos
		const response = await fetch('/usermanagement/front/get/pseudos', {
			method: 'GET',
			credentials: 'include'
		});

		let pseudos;
		try {
			pseudos = await response.json();
		} catch (err) {
			list.innerHTML = `<li class="text-red-500">Invalid server response.</li>`;
			return;
		}

		if (!response.ok) {
			const errorMessage = (pseudos?.error) ? pseudos.error : 'Error fetching pseudos.';
			const li = document.createElement('li');
			li.className = 'text-red-500';
			li.textContent = errorMessage || 'Error fetching pseudos.';
			list.appendChild(li);
			return;
		}

		// Filter based on search input
		const filtered = Array.isArray(pseudos)
			? pseudos.filter(({ pseudo }) =>
				pseudo.toLowerCase().includes(searchTerm)
			)
			: [];

		if (filtered.length === 0) {
			list.innerHTML = '<li class="text-white">No matching pseudos found.</li>';
			return;
		}

		// Display filtered pseudos
		filtered.forEach(({ pseudo, user_id }) => {
			const li = document.createElement('li');
			li.classList.add(
			'text-white', 'mb-2.5', 'flex', 'justify-between',
			'items-center', 'gap-2.5', 'font-bold'
			);

			const span = document.createElement('span');
			span.textContent = pseudo || 'Inconnu';

			span.addEventListener("click", () => {
				history.pushState(null, '', "friend_profile?friendId=" + user_id);
				// changeFriendIDProfile(user_id);
				router();
			});

			const button = document.createElement('button');
			button.textContent = 'Add';
			button.classList.add(
			'bg-green-600', 'rounded', 'py-1', 'px-3',
			'hover:bg-green-700', 'text-white', 'font-bold'
			);

			button.addEventListener('click', async () => {
				const res = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/post/friendship`, {
					method: 'POST',
					credentials: 'include',
					headers: {
					'Content-Type': 'application/json'
					},
					body: JSON.stringify({ targetPseudo: pseudo })
				});

				if (res.ok) {
					message.textContent = `Friend request sent to ${pseudo}`;
					message.className = 'text-green-500 font-semibold';
				} else {
					message.textContent = `Error sending friend request to ${pseudo}`;
					message.className = 'text-red-500 font-semibold';
				}
			});

			li.appendChild(span);
			li.appendChild(button);
			list.appendChild(li);
		});
	});

	// (document.getElementById('showPseudosBtn')!).addEventListener('click', async () => {
	// 	const list = document.getElementById('pseudoList');
	// 	(list!).innerHTML = ''; // Réinitialise la liste
		
	// 	const response = await fetch('/usermanagement/front/get/pseudos', {
	// 	  method: 'GET',
	// 	  credentials: 'include'
	// 	});
		
	// 	const pseudos = await response.json(); // attend [{ pseudo: 'alice', user_id:'1' }, { pseudo: 'bob', user_id:'2' }]

	// 	if (!response.ok) {
	// 	  const errorData = await response.json();
	// 	  (list!).innerHTML = `<li>${errorData.error || 'Error fetching pseudos.'}</li>`;
	// 	  return;
	// 	}

	// 	if (Array.isArray(pseudos) && pseudos.length > 0) {
	// 	  pseudos.forEach(({ pseudo, user_id }) => {
	// 		const li = document.createElement('li');
	// 		li.classList.add('text-white', 'mb-2.5', 'flex', 'justify-between', 'items-center', 'gap-2.5', 'font-bold');
		
	// 		const span = document.createElement('span');

	// 		span.addEventListener("click", () => {

	// 			 //console.log("friend id before sessionStorage:", friend.friend_id);
	// 			 //customPushState(null, '', "friend_profile");
	// 			 history.pushState(null, '', "friend_profile");
	// 			 changeFriendIDProfile(user_id)
	// 			 router();

	// 		})
	// 		span.textContent = pseudo || 'Inconnu';
	// 		const button = document.createElement('button');
	// 		button.textContent = 'Add';
	// 		button.classList.add('bg-green-600', 'rounded', 'py-1', 'px-3', 'hover:bg-green-700', 'text-white', 'font-bold');//, 'hover:bg-green-700', 'text-white font-bold', 'py-1', 'px-3');
	// 		button.addEventListener('click', async () => {
	// 		  const res = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/post/friendship`, {
	// 			method: 'POST',
	// 			credentials: 'include',
	// 			headers: {
	// 			  'Content-Type': 'application/json'
	// 			},
	// 			body: JSON.stringify({ targetPseudo: pseudo })
	// 		  });
		
	// 		  const message = document.getElementById('message');
	// 		  if (res.ok) {
	// 			(message!).textContent = `Friend request sent to ${pseudo}`;
	// 			message!.classList.add('text-green-500');

	// 		  } else {
	// 			(message!).textContent = `Error sending friend request to ${pseudo}`;
	// 			message!.classList.add('text-red-500');

	// 		  }
	// 		});
		
	// 		li.appendChild(span);
	// 		li.appendChild(button);
	// 		(list!).appendChild(li);
	// 	  });
	// 	}
		
	// });

	const matchsResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/matchlist`, {
		method: 'GET',
		credentials: 'include'
	});

	if (matchsResponse.ok) {
		const matchsContainer = document.getElementById('matchs-list') as HTMLDivElement | null;
		const matchsData = await matchsResponse.json();
	  
		if (matchsData && matchsData.length > 0 && matchsContainer) {
			matchsContainer.innerHTML = ''; // Clear previous matches
		
			const matchTemplate = document.getElementById('match-template') as HTMLTemplateElement;

			let wins = 0;
			let looses = 0;

			matchsData.forEach((match: any) => {
				const isWin = match.winner_pseudo === match.user_pseudo;

				const clone = matchTemplate.content.cloneNode(true) as HTMLElement;

				const matchElement = clone.querySelector('div')!;
				matchElement.classList.add(isWin ? 'bg-green-700' : 'bg-red-700');

				const enemySpan = clone.querySelector('.enemy-pseudo')!;
				enemySpan.textContent = match.enemy_pseudo;
				enemySpan.addEventListener('click', () => {
					history.pushState(null, '', "friend_profile?friendId=" + match.enemy_id);
					// changeFriendIDProfile(match.enemy_id);
					router();
				});
				clone.querySelector('.score-text')!.textContent = `${match.user_score} : ${match.enemy_score}`;
				clone.querySelector('.match-date')!.textContent = match.date;

				const badge = clone.querySelector('.result-badge')!;
				badge.textContent = isWin ? 'WIN' : 'LOOSE';
				if (isWin) {
					wins++;
					badge.classList.add('bg-green-500', 'text-green-900');
				} else {
					looses++;
					badge.classList.add('bg-red-500', 'text-red-900');
				}
				  
				matchsContainer!.prepend(clone);
			});

			
			(document.getElementById('wins')!).textContent = String(wins) || '0';
			(document.getElementById('looses')!).textContent = String(looses) || '0';
		  
		} else {
		  if (matchsContainer)
			matchsContainer.innerHTML = `<p class="text-gray-400 text-center">No matches found.</p>`;
		}
	  }

	

	//Friend requests

	// fetchList('friend-list-blocked', 'blocked-user-template', '/usermanagement/front/get/friendships_blocked');

	fetchList('friend-list-accepted', 'friend-template', '/usermanagement/front/get/friendships_accepted');

	fetchList('friend-requests-list', 'friend-request-template','/usermanagement/front/get/friendships_pending');

	modifyAvatar();

	twoFactorAuthentication();

  }

async function fetchList(containerElement: string, templateElement: string, url: string) {
	try {
	  const response = await fetch(`https://${window.location.hostname}:8443${url}`, {
		method: 'GET',
		credentials: 'include'
	  });

	  if (!response.ok) {
		console.log("Error");
	  }
	  //console.log("fetch succesful");

	  const data = await response.json(); // ex: [{ pseudo: 'eqwq', id: 2}]
	  const container = document.getElementById(containerElement) as HTMLDivElement | null;
		if (container) {
			container.innerHTML = '';
		}
	  //console.log(data)
	  data.forEach((friend: any) => {
		//console.log(friend.pseudo);
		addElement(friend, containerElement, templateElement);

	});
	} catch (error) {
		console.error('Error:', error);
	}
}

// export let friend_id_for_profile: string;

// export function changeFriendIDProfile(friend_id: string) {
// 	friend_id_for_profile = friend_id
// }
// export function getFriendIDProfile() {
// 	return friend_id_for_profile
// }

function addElement(friend: any, containerElement: string, templateElement: string) {
	const requestListContainer = document.getElementById(containerElement) as HTMLDivElement | null;
	const templateRequest = document.getElementById(templateElement) as HTMLTemplateElement | null;

	if (templateRequest)
	{
		const Clone = templateRequest.content.cloneNode(true) as DocumentFragment;
		const divToUse = Clone.querySelector('#entry');
		if (divToUse)
		{
			divToUse.id = `friend-${friend.id}`;
		}

		//console.log("divToUse: ", divToUse);

		const span = Clone.querySelector('span');
		//console.log("span selection log: ", span);

		//friends
		if (span) {
			span.textContent = friend.pseudo;
			//span.classList.add("nav-link")
			//span.setAttribute('data-path', "friend_profile");
			span.addEventListener("click", () => {
				 history.pushState(null, '', "friend_profile?friendId=" + friend.friend_id);
				 //changeFriendIDProfile(friend.friend_id)
				 router();

			})
		}
		if (containerElement == 'friend-list-accepted')
		{
			const button = Clone.querySelector('button');
			(button!).onclick = () => {
				if (divToUse)
				{
					deleteFriendship(friend.id);
				}
			};
			
			const friendStatus = WsFriendStatus(friend.friend_id);
			//console.log("Friend status:", friendStatus);

			const statusElement = document.createElement('span');
			statusElement.textContent = friendStatus ? 'connected' : 'disconnected';
			statusElement.style.color = friendStatus ? 'green' : 'red';
			statusElement.style.marginLeft = '8px';
			statusElement.style.fontWeight = 'bold';

			// Insérer le statut avant le premier bouton
			button?.parentElement?.insertBefore(statusElement, button);

		}
		//requests
		if (containerElement == 'friend-requests-list')
		{
			const button = Clone.querySelector('#accept-button') as HTMLButtonElement;
			(button!).onclick = () => {
				if (divToUse)
				{
					acceptFriendship(friend.id);

				}
			};
			
		}
		//blocked
		// if (containerElement == 'friend-list-blocked')
		// {
		// 	const button = Clone.querySelector('button') as HTMLButtonElement;
		// 	(button!).onclick = () => {
		// 		if (divToUse)
		// 		{
		// 			unblockFriendship(friend.id);
		// 		}
		// 	};
		// 	const button = Clone.querySelector('#accept-button');
		// 	button.onclick = acceptFriendship(friend.id);
		// }

		// Check if the span element inside the template exists
		//console.log("clone append log");
		if (requestListContainer) {
			requestListContainer.appendChild(Clone);
		}
	}
}

const blockFriendship = async (ID: number) => {
	//console.log("Friendship blocked");
	try {
		const postResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/patch/block_friendship`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: ID })
		});
		if (!postResponse.ok) {
			throw new Error('Error blocking friendship');
		}
		// const element = document.getElementById(`friend-${ID}`) as HTMLDivElement;
	  	// (element).remove()
		// fetchList('friend-list-blocked', 'blocked-user-template', '/usermanagement/front/get/friendships_blocked');
	} catch (error: any) {
		alert('Error : ' + error.message);
	};
}

const deleteFriendship = async (ID: number) => {
	//console.log("Friendship removed");
	try {
	  const postResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/delete/delete_friendship`, {
		method: 'DELETE',
		credentials: 'include',
		headers: {
		  'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id: ID })
	  });
	  if (!postResponse.ok) {
		throw new Error('Error deleting friendship');
	  }

	  const element = document.getElementById(`friend-${ID}`) as HTMLDivElement;
	  (element).remove()
	
	} catch (error: any) {
	  alert('Error : ' + error.message);
	}
  };

const acceptFriendship = async (ID: number) => {
	//console.log("Friendship accepted");
	try {
		//console.log("the id:", ID);
		const postResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/patch/accept_friendship`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
			'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: ID })
		});
		if (!postResponse.ok) {
			throw new Error('Error accepting friendship');
		}
		//console.log("1");
		const element = document.getElementById(`friend-${ID}`) as HTMLDivElement;
		//console.log("2");
		(element).remove();

		resetDictionaryWs();
		//console.log("3");
		fetchList('friend-list-accepted', 'friend-template', '/usermanagement/front/get/friendships_accepted');
		//console.log("4");
		

	} catch (error: any) {
	  alert('Error : ' + error.message);
	}

  };

const unblockFriendship = async (ID: number) => {
	//console.log("Friendship unblocked");
	try {
		const postResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/delete/delete_friendship`, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: ID })
		});
		if (!postResponse.ok) {
			throw new Error('Error unblocking friendship');
		}
		const element = document.getElementById(`friend-${ID}`) as HTMLDivElement;
		//console.log("2");
		(element).remove();
	} catch (error: any) {
		alert('Error : ' + error.message);
	}
}

// requests.forEach(request => {
// 	addRequest(request);
// });


//Friends
// const friends: string[] = [];

// const friendListContainer = document.getElementById('friend-list-accepted') as HTMLDivElement | null;
// const template = document.getElementById('friend-template') as HTMLTemplateElement | null;

// function addFriendToList(name: string) {
// 	if (template)
// 	{
// 		const friendClone = template.content.cloneNode(true) as DocumentFragment;

// 		const span = friendClone.querySelector('span');

// 		// Check if the span element inside the template exists
// 		if (span) {
// 			span.textContent = name;
// 		}

// 		if (friendListContainer) {
// 			friendListContainer.appendChild(friendClone);
// 		}
// 	}
// }

// friends.forEach(friend => {
// 	addFriendToList(friend);
// });


//Blocked Users
// const blockedUsers: string[] = ['Mathis'];

// const blockedListContainer = document.getElementById('friend-list-blocked') as HTMLDivElement | null;
// const templateBlocked = document.getElementById('blocked-user-template') as HTMLTemplateElement | null;

// function addBlockToList(name: string) {
// 	if (templateBlocked)
// 	{
// 		const Clone = templateBlocked.content.cloneNode(true) as DocumentFragment;

// 		const span = Clone.querySelector('span');

// 		// Check if the span element inside the template exists
// 		if (span) {
// 			span.textContent = name;
// 		}

// 		if (blockedListContainer) {
// 			blockedListContainer.appendChild(Clone);
// 		}
// 	}
// }

// blockedUsers.forEach(user => {
// 	addBlockToList(user);
// });

// Modify AVATAR
async function modifyAvatar() {
	// Récup des éléments
	const form = document.getElementById('formAvatar') as HTMLFormElement | null;
	const modifyBtn = document.getElementById('modifyAvatarBtn') as HTMLButtonElement | null;
	const sendBtn = document.getElementById('sendAvatarBtn') as HTMLButtonElement | null;
	const input = document.getElementById('inputAvatar') as HTMLInputElement | null;
	const avatarImg = document.getElementById('avatar-box') as HTMLImageElement | null;
	const deleteAvatarBtn = document.getElementById('deleteAvatarBtn') as HTMLButtonElement | null;

	// Évite de ré-attacher des listeners si la fonction est rappelée
	if (form?.dataset.initialized === 'true') return;
	if (form) form.dataset.initialized = 'true';

	// Toggle du formulaire avec le bouton "Modify Avatar"
	modifyBtn?.addEventListener('click', () => {
		if (!form) return;
		form.classList.toggle('hidden');
		// (optionnel) accessibilité
		modifyBtn.setAttribute('aria-expanded', String(!form.classList.contains('hidden')));
	});

	// Envoi de l'avatar
	sendBtn?.addEventListener('click', async () => {
		if (!input?.files || input.files.length === 0) {
			alert('Please select a JPG image to upload.');
			return;
		}

		// (optionnel) validation rapide côté client
		const file = input.files[0];
		if (file.type !== 'image/jpeg') {
			alert('Only JPEG is allowed.');
			return;
		}
		if (file.size > 30000) {
			alert('Max size 30KB.');
			return;
		}

		sendBtn.disabled = true;

		try {
			const formData = new FormData();
			formData.append('image', file);

			const reply = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/patch/modify_avatar`, {
				method: 'PATCH',
				credentials: 'include',
				body: formData,
			});

			const statusElem = document.getElementById('statusModifyAvatar');

			if (!reply.ok) {
				const errorData = await reply.json();
				if (statusElem) {
					statusElem.textContent = errorData.error || 'Upload failed';
					statusElem.className = 'text-red-500 font-semibold';
				}
				throw new Error(errorData.error || 'Upload failed');
			} else {
				if (statusElem) {
					statusElem.textContent = 'Avatar uploaded successfully';
					statusElem.className = 'text-green-500 font-semibold';
				}
			}

			// Récup session pour l’ID
			const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
				method: 'GET',
				credentials: 'include',
			});
			if (!response.ok) throw new Error('Unable to fetch session');

			const session = await response.json();
			const id = session.name as string;

			// Met à jour l’avatar (avec cache-busting)
			if (avatarImg) {
				avatarImg.src = `public/avatars/${id}.jpg?cb=${Date.now()}`;
				avatarImg.alt = 'My Avatar';
			}

			// Reset + re-cache le formulaire après envoi
			form?.classList.add('hidden');
			modifyBtn?.setAttribute('aria-expanded', 'false');
			if (input) input.value = '';
		} catch (error) {
			console.error('Error uploading avatar:', error);
			alert('Upload failed. Please try again.');
		} finally {
			sendBtn.disabled = false;
		}
	});

	// Suppression de l’avatar (si tu as ce bouton dans le DOM)
	deleteAvatarBtn?.addEventListener('click', async () => {
		deleteAvatarBtn.disabled = true;
		try {
			const reply = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/delete/delete_avatar`, {
				method: 'DELETE',
				credentials: 'include',
			});
			
			const statusElem = document.getElementById('statusModifyAvatar');
			
			if (!reply.ok) {
				const errorData = await reply.json();
				if (statusElem) {
					statusElem.textContent = errorData.error || 'Delete failed';
					statusElem.className = 'text-red-500 font-semibold';
				}
				throw new Error(errorData.error || 'Delete failed');
			} else {
				if (statusElem) {
					statusElem.textContent = 'Avatar deleted successfully';
					statusElem.className = 'text-green-500 font-semibold';
				}
			}

			// Option : mettre une image par défaut après suppression
			if (avatarImg) {
				avatarImg.src = `public/avatars/default_avatar.jpg?cb=${Date.now()}`;
				avatarImg.alt = 'Default Avatar';
			}

			// Re-cache le formulaire et reset input
			form?.classList.add('hidden');
			modifyBtn?.setAttribute('aria-expanded', 'false');
			if (input) input.value = '';
		} catch (error) {
			console.error('Error deleting avatar:', error);
			alert('Delete failed. Please try again.');
		} finally {
			deleteAvatarBtn.disabled = false;
		}
	});
}

// async function modifyAvatar() {
// 	document.getElementById("modifyAvatarBtn")?.addEventListener("click", () => {
// 		const form = document.getElementById("formAvatar");
// 		form?.classList.toggle("hidden");
// 	});
// 	const sendAvatarBtn = document.getElementById('sendAvatarBtn');
// 	if (sendAvatarBtn) {
// 		sendAvatarBtn.addEventListener('click', async () => {
// 			const input = document.getElementById('inputAvatar') as HTMLInputElement;
// 			if (!input.files || input.files.length === 0) {
// 				alert('Please select an image to upload.');
// 				return;
// 			}

// 			const formData = new FormData();
// 			formData.append('image', input.files[0]);

// 			try {
// 				const reply = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/patch/modify_avatar`, {
// 					method: 'PATCH',
// 					credentials: 'include',
// 					body: formData,
// 				});

// 				//TODO mathis, manejar la respuesta de archivo invalido en el frontend (manejar el codigo 422, mostrar mensaje ....)
// 				if (reply.status == 422)
// 				{
// 					//TODO archivo invalido  imagenes de 100x100 jpg max 30000 bytes (30kb)
// 					console.log("Invalid file format. 100x100 jpg max 30kb")
// 				}

// 				const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
// 					method: 'GET',
// 					credentials: 'include',
// 				});
// 				if (!response.ok)
// 				{
// 					console.log("Erroooor!");
// 				}
// 				let session = await response.json();
// 				const id = session.name;

// 				const img = document.createElement('img');
// 				img.src = `public/avatars/${id}.jpg`;
// 				//console.log("file name: ", input.files[0].name);
// 				img.alt = 'My Avatar';
// 				//img.width = 300; // optional
// 				let avatarBox = document.getElementById("avatar-box");
// 				if (avatarBox)
// 					avatarBox.appendChild(img);
// 			} catch (error) {
// 				console.error('Error uploading avatar:', error);
// 			}
// 		});
// 	}

// 	const deleteAvatarBtn = document.getElementById('deleteAvatarBtn');
// 	if (deleteAvatarBtn) {
// 		deleteAvatarBtn.addEventListener('click', async () => {
// 			try {
// 				const reply = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/delete/delete_avatar`, {
// 				method: 'DELETE',
// 				credentials: 'include',
// 				});

// 			} catch (error) {
// 				console.error('Error deleting avatar:', error);
// 			}
// 		});
// 	}
// }


async function deleteAccount() {
	if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
	  const response = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/delete/user`, {
		method: 'DELETE',
		credentials: 'include'
	  });

	  if (response.ok) {
		alert('Your account has been deleted successfully.');
		history.pushState(null, '', '/');
		router();
	  } else {
		alert('Error during account deletion. Please try again later.');
	  }
	}
}

async function twoFactorAuthentication()
{
	const twoFAStatusResponse = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/get/2fa/status`, {
		method: 'GET',
		credentials: 'include'
	});

	if (!twoFAStatusResponse.ok) {
		console.error('Error fetching 2FA status');
		return;
	}
	const twoFAStatusData = await twoFAStatusResponse.json();
	const twoFAEnabled = twoFAStatusData.two_fa;

	const enable2FAButton =  document.getElementById('enable2FAButton')
	const disable2FAButton = document.getElementById('disable2FAButton');

	if (!twoFAEnabled) {
		(enable2FAButton!).classList.remove('hidden');
		(disable2FAButton!).classList.add('hidden'); // ou `block`, selon ton style
	}
	else  {
		(disable2FAButton!).classList.remove('hidden');
		(enable2FAButton!).classList.add('hidden'); // enlève ce que tu aurais pu mettre
	}
	
	if (enable2FAButton) {
		enable2FAButton.addEventListener('click', async () => {
			const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
				method: 'GET',
				credentials: 'include'
			});
		
			if (!sessionResponse.ok) {
				history.pushState(null, '', "/login");
				router();
				return;
			}
		
			const sessionData = await sessionResponse.json();
			let id = sessionData.name;

			const response = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/post/2fa/setup`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: id })
			});

			if (!response.ok) {
				alert("2FA already enabled.");
				return;
			}

			const data = await response.json();

			// ✅ Affiche le QR code et la clé manuelle
			(document.getElementById('qrCodeImage')! as HTMLImageElement).src = data.qrCode;
			(document.getElementById('manualKey')!).textContent = data.manualKey;
			const qrCodeContainer = document.getElementById('qrCodeContainer')!;
			qrCodeContainer.classList.remove('hidden');
			qrCodeContainer.classList.add('block');
		});

		// ✅ 2) Quand l'utilisateur entre le code de Google Authenticator et clique sur "Vérifier"
		const verify2FAButton = document.getElementById('verify2FAButton')
		if (verify2FAButton) {
			verify2FAButton.addEventListener('click', async () => {
				const sessionResponse = await fetch(`https://${window.location.hostname}:8443/usermanagement/front/get/profile_session`, {
					method: 'GET',
					credentials: 'include'
				});
			
				if (!sessionResponse.ok) {
					history.pushState(null, '', "/login");
					router();
					return;
				}
			
				const sessionData = await sessionResponse.json();
				let id = sessionData.name;

				const code = (document.getElementById('verify2FACode')! as HTMLTextAreaElement).value.trim();

				if (!code || code.length !== 6) {
					alert("Enter a 6 length digit code");
					return;
				}

				const response = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/post/2fa/enable`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId: id, google_token: code })
				});

				const msg = document.getElementById('twoFAStatusMessage') as HTMLParagraphElement;

				if (response.ok) {
					msg.classList.add('text-green-500');
					msg.textContent = "2FA enabled";
				} else {
					const errorData = await response.json();
					console.error('Error enabling 2FA: ', errorData.error);
					msg.classList.add('text-red-500');
					msg.textContent = errorData.error || 'Error enabling 2FA.';
				}
			});
		}
	}

	if (disable2FAButton) {
		disable2FAButton.addEventListener('click', async () => {
			if (!confirm("Are you sure you want to disable 2FA ?")) return;

			const response = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/patch/2fa/delete`, {
			method: 'PATCH',
			credentials: 'include'
			});

			const msg = document.getElementById('twoFAStatusMessage') as HTMLParagraphElement;

			if (response.ok) {
			msg.classList.add('text-green-500');
			msg.textContent = "2FA Disabled";
			alert("2FA Disabled successfully.");
			} else {
			msg.classList.add('text-red-500');
			msg.textContent = "2FA is not enabled.";
			alert("Error disabling 2FA, it may not be enabled.");
			}
		});
	}
}



export {};
