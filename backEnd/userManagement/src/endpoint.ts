import { ImageValidator } from "./imageValidator";
// import bcrypt from 'bcryptjs';

export abstract class Endpoint {

	protected static list: Set<Endpoint> = new Set();
	protected path: string;
	protected errorMsg: string;

	constructor(path: string, errorMsg: string	) {
		this.path = path;
		this.errorMsg = errorMsg;
		Endpoint.list.add(this);
	}
	
	protected abstract add(server: any): void;

	public static enableAll(server: any): void {
		for (const endpoint of Endpoint.list)
			endpoint.add(server);
	}
}

export class GetMatchListEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`GetMatchListEndpoint: ${this.path} called`);
			const userId = request.user.id;

			try {
				const response = await fetch(`http://dataBase:3000/get/matchs?id=${userId}`);
				if (!response.ok) {
					throw new Error(`Failed to fetch match list: ${response.statusText}`);
				}
				const data = await response.json();
				console.log('GetMatchListEndpoint: Data received:', data);
				reply.send(data);
			} catch (error) {
				console.error('Error fetching match list:', error);
				reply.status(500).send({ error: 'Failed to fetch match list' });
			}
		});
	}
}

export class GetFriendMatchListEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`GetFriendMatchListEndpoint: ${this.path} called`);
			const friendId = request.query.id;

			if (!friendId) {
				reply.status(400).send({ error: 'Friend ID is required' });
				return;
			}

			// const response1 = await fetch(
			// 	`http://dataBase:3000/get/friends_user?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}&id5=${user.id}`,
			// 	{ method: 'GET' }
			// );
			// if (!response1.ok) {
			// 	server.log.error(`GetFriendMatchListEndpoint: ${this.errorMsg} - `, response1.statusText);
			// 	reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
			// 	return;
			// }
			// const friends = await response1.json();
			// console.log('GetFriendMatchListEndpoint: Friends data received:', friends);
			// let isFriend = false;
			// for (const friend of friends) {
			// 	if (friend.id.toString() === friendId) {
			// 		console.log(`GetFriendMatchListEndpoint: User ${user.id} is friends with ${friendId}`);
			// 		isFriend = true;
			// 		break;
			// 	}
			// 	console.log(`GetFriendMatchListEndpoint: User ${user.id} is not friends with ${friend.id}`);
			// }

			// if (!isFriend) {
			// 	console.log(`GetFriendMatchListEndpoint: User ${user.id} is not friends with ${friendId}`);
			// 	reply.status(403).send({ error: 'You are not friends with this user' });
			// 	return;
			// }

			try {
				const response = await fetch(`http://dataBase:3000/get/matchs?id=${friendId}`);
				if (!response.ok) {
					throw new Error(`Failed to fetch match list: ${response.statusText}`);
				}
				const data = await response.json();
				console.log('GetFriendMatchListEndpoint: Data received:', data);
				reply.send(data);
			} catch (error) {
				console.error('Error fetching match list:', error);
				reply.status(500).send({ error: 'Failed to fetch match list' });
			}
		});
	}
}

import sharp from "sharp";
export class ModifyAvatarEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			
			console.log(`ModifyAvatarEndpoint: ${this.path} called`);

			const file = await request.file();
			const userId = request.user.id;

			//TODO mathis, hashear el userId
			let hashedId: string = userId;

			let avatarLink: string = `public/avatars/${hashedId}.jpg`

			if (!file || await ImageValidator.validate(file, 100, 100, 30000) === false) {
				reply.status(422).send({ error: 'Invalid file format' });
				return;
			}

			let imageBuffer = await file.toBuffer();

			try {
				const resizedImageBuffer = await sharp(imageBuffer)
					.resize(100, 100)
					.toFormat("jpeg")
					.toBuffer();
				imageBuffer = resizedImageBuffer;
			} catch (err) {
				console.error('Error resizing avatar:', err);
				reply.status(500).send({ error: 'Failed to resize avatar image' });
				return;
			}

			try {
				const formData = new FormData();

				formData.append('avatar', new Blob([imageBuffer], { type: file.mimetype }), file.filename);
				formData.append('hashedId', hashedId);

				await fetch('http://webServer:3000/post/avatar', {
					method: 'POST',
					body: formData,
				});

 				await fetch('http://dataBase:3000/patch/avatar', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ avatar: avatarLink, id: userId })
				});

			} catch (err) {
				console.error('Error changing avatar:', err);
				reply.status(500).send({ error: 'Failed to process avatar image' });
			}
		});
	}
}

export class DeleteAvatarEndpoint extends Endpoint {
	add(server: any): void {
		server.delete(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`DeleteAvatarEndpoint: ${this.path} called`);
			const userId = request.user.id;
			const defaultLink: string = "public/avatars/default_avatar.jpg";
			let avatarLink!:string;

			try {
				const response = await fetch(`http://dataBase:3000/get/avatar?id=${userId}`);
				const data = await response.json();
				avatarLink = data[0].avatar;
	
				await fetch('http://webServer:3000/delete/avatar', {
					method: 'POST',
					body: avatarLink
				});

				await fetch('http://dataBase:3000/patch/avatar', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ avatar: defaultLink, id: userId })
				});

				console.log(`Avatar deleted for user ${userId}`);
				reply.send({ message: 'Avatar deleted successfully' });
			} catch (err) {
				console.error('Error deleting avatar:', err);
				reply.status(500).send({ error: 'Failed to delete avatar image' });
			}
		});
	}
}

export class SeeAllUsersEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			console.log(`SeeAllUsersEndpoint: ${this.path} called`);
			const response = await fetch('../src/users', {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeAllUsersEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeAllUsersEndpoint: Data received:', data);
			reply.send(data);
		});
	}
}

export class SeeAllProfilesEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			console.log(`SeeAllProfilesEndpoint: ${this.path} called`);
			const response = await fetch('http://dataBase:3000/get/profiles', {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeAllProfilesEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeAllProfilesEndpoint: Data received:', data);
			reply.send(data);
		});
	}
}

export class SeeAllFriendsEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			console.log(`SeeAllFriendsEndpoint: ${this.path} called`);
			const response = await fetch('http://dataBase:3000/get/friends', {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeAllFriendsEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeAllFriendsEndpoint: Data received:', data);
			reply.send(data);
		});
	}
}

export class SeePseudosEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeePseudosEndpoint: ${this.path} called`);
			const id = request.user.id;
			const response = await fetch(`http://dataBase:3000/get/pseudos?id=${id}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeePseudosEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			if (data === "[]") {
				reply.status(404).send({ error: 'No pseudos found' });
				return;
			}
			console.log('SeePseudosEndpoint: Data received:', data);
			reply.send(data);
		});
	}	
}

export class SeeProfileEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeProfileEndpoint: ${this.path} called`);
			const user = request.user;
			// const id = request.query.id;
			// if (!id) {
			// 	reply.status(400).send({ error: 'User ID is required' });
			// 	return;
			// }
			const response = await fetch(`http://dataBase:3000/get/profile?user=${user.id}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeProfileEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			if (data.length === 0) {
				reply.status(404).send({ error: 'User not found' });
				return;
			}
			console.log('SeeProfileEndpoint: Data received:', data);
			reply.send(data);
		});
	}
}

export class SeeFriendProfileEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeFriendProfileEndpoint: ${this.path} called`);
			// const user = request.user;
			const friendId = request.query.id;

			if (!friendId) {
				reply.status(400).send({ error: 'Friend ID is required' });
				return;
			}

			// const response1 = await fetch(
			// 	`http://dataBase:3000/get/friends_user?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}&id5=${user.id}`,
			// 	{ method: 'GET' }
			// );
			// if (!response1.ok) {
			// 	server.log.error(`SeeUserFriendshihpsEndpoint: ${this.errorMsg} - `, response1.statusText);
			// 	reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
			// 	return;
			// }
			// const friends = await response1.json();
			// console.log('SeeFriendProfileEndpoint: Friends data received:', friends);
			// let isFriend = false;
			// for (const friend of friends) {
			// 	if (friend.id.toString() === friendId) {
			// 		console.log(`SeeFriendProfileEndpoint: User ${user.id} is friends with ${friendId}`);
			// 		isFriend = true;
			// 		break;
			// 	}
			// 	console.log(`SeeFriendProfileEndpoint: User ${user.id} is not friends with ${friend.id}`);
			// }

			// if (!isFriend) {
			// 	console.log(`SeeFriendProfileEndpoint: User ${user.id} is not friends with ${friendId}`);
			// 	reply.status(403).send({ error: 'You are not friends with this user' });
			// 	return;
			// }
			// const id = request.query.id;
			// if (!id) {
			// 	reply.status(400).send({ error: 'User ID is required' });
			// 	return;
			// }
			const response2 = await fetch(`http://dataBase:3000/get/profile?user=${friendId}`, {
				method: 'GET'});
			if (!response2.ok) {
				server.log.error(`SeeFriendProfileEndpoint: ${this.errorMsg} - `, response2.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response2.json();
			if (data.length === 0) {
				reply.status(404).send({ error: 'User not found' });
				return;
			}
			console.log('SeeFriendProfileEndpoint: Data received:', data);
			reply.send(data);
		});
	}
}

export class CreateFriendshipEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`CreateFriendshipEndpoint: ${this.path} called`);
			const user = request.user;
			const friendPseudo = request.body.targetPseudo;
			if (!friendPseudo) {
				reply.status(400).send({ error: 'Friend Pseudo is required' });
				return;
			}

			const response = await fetch(`http://dataBase:3000/get/user_id_from_pseudo?user=${friendPseudo}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`CreateFriendshipEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			if (data.length === 0) {
				reply.status(404).send({ error: 'Friend not found' });
				return;
			}
			const friendId = data[0].user_id;
			console.log(`Creating friendship between user ${user.id} and friend ${friendId}`);
			if (friendId === user.id) {
				reply.status(400).send({ error: 'You cannot be friend yourself' });
				return;
			}
			let uid1 = Math.min(user.id, friendId);
			let uid2 = Math.max(user.id, friendId);
			const friendshipResponse = await fetch('http://dataBase:3000/post/friendship', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uid1, uid2 , sender: user.id})
			});
			if (!friendshipResponse.ok) {
				server.log.error(`CreateFriendshipEndpoint: ${this.errorMsg} - `, friendshipResponse.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			console.log(`Friendship created between user ${user.id} and friend ${friendId}`);
			reply.send({ message: 'Friendship created successfully' });
		});
	}
}

export class SeeUserFriendshihpsEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeUserFriendshihpsEndpoint: ${this.path} called`);
			const user = request.user;
			const response = await fetch(
				`http://dataBase:3000/get/friends_user?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}&id5=${user.id}`,
				{ method: 'GET' }
			);
			if (!response.ok) {
				server.log.error(`SeeUserFriendshihpsEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeUserFriendshihpsEndpoint: Data received:', data);

			
			reply.send(data);
		});
	}
}

export class SeeFriendIdEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeFriendIdEndpoint: ${this.path} called`);
			const user = request.user;
			const id = request.query.id;
			const response = await fetch(
				`http://dataBase:3000/get/friend_id?id1=${user.id}&id2=${id}`,
				{ method: 'GET' }
			);
			if (!response.ok) {
				server.log.error(`SeeFriendIdEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeFriendIdEndpoint: Data received:', data);

			
			reply.send(data);
		});
	}
}

export class SeeFriendshihpsPendingEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeFriendshihpsPendingEndpoint: ${this.path} called`);
			const user = request.user;
			const response = await fetch(`http://dataBase:3000/get/friendships_pending?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}&id5=${user.id}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeFriendshihpsPendingEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeFriendshihpsPendingEndpoint: Data received:', data);

			
			reply.send(data);
		});
	}
}

export class AcceptFriendshipEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`AcceptFriendshipEndpoint: ${this.path} called`);
			const user = request.user;
			const id = request.body.id;
			if (!id) {
				reply.status(400).send({ error: 'Request Id is required' });
				return;
			}

			const response = await fetch(`http://dataBase:3000/patch/friendship`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
				});
			if (!response.ok) {
				server.log.error(`AcceptFriendshipEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			
			console.log(`Friendship request ${id} accepted for user ${user.id}`);
			reply.send({ message: 'Friendship request accepted successfully' });
		});
	}
}

export class SeeFriendshihpsAcceptedEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeFriendshihpsAcceptedEndpoint: ${this.path} called`);
			const user = request.user;
			const response = await fetch(`http://dataBase:3000/get/friendships_accepted?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeFriendshihpsAcceptedEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeFriendshihpsAcceptedEndpoint: Data received:', data);

			
			reply.send(data);
		});
	}
}

export class BlockFriendshipEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`BlockFriendshipEndpoint: ${this.path} called`);
			const user = request.user;
			const id = request.body.id;
			if (!id) {
				reply.status(400).send({ error: 'Request Id is required' });
				return;
			}

			const response = await fetch(`http://dataBase:3000/patch/friendship_block`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
				});
			if (!response.ok) {
				server.log.error(`BlockFriendshipEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			
			console.log(`Friendship request ${id} blocked for user ${user.id}`);
			reply.send({ message: 'Friendship request blocked successfully' });
		});
	}
}

export class SeeFriendshihpsBlockedEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`SeeFriendshihpsBlockedEndpoint: ${this.path} called`);
			const user = request.user;
			const response = await fetch(`http://dataBase:3000/get/friendships_blocked?id1=${user.id}&id2=${user.id}&id3=${user.id}&id4=${user.id}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeFriendshihpsBlockedEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			console.log('SeeFriendshihpsBlockedEndpoint: Data received:', data);

			
			reply.send(data);
		});
	}
}

export class DeleteFriendshipEndpoint extends Endpoint {
	add(server: any): void {
		server.delete(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`DeleteFriendshipEndpoint: ${this.path} called`);
			const user = request.user;
			const id = request.body.id;
			if (!id) {
				reply.status(400).send({ error: 'Request Id is required' });
				return;
			}

			const response = await fetch(`http://dataBase:3000/delete/friendship`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
				});
			if (!response.ok) {
				server.log.error(`DeleteFriendshipEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			
			console.log(`Friendship request ${id} deleted for user ${user.id}`);
			reply.send({ message: 'Friendship request deleted successfully' });
		});
	}
}


export class ModifyBioEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`ModifyBioEndpoint: ${this.path} called`);
			const user = request.user;
			const bio = request.body.bio;
			if (!bio) {
				reply.status(400).send({ error: 'Bio is required' });
				return;
			}

			if (bio.length > 500) {
				reply.status(400).send({ error: 'Bio must be less than 500 characters' });
				return;
			}
			if (!/^[\w\s.,!?'"@#&()\-:;\/\\\[\]{}|<>€£$%^*+=~`àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇáéíóúÁÉÍÓÚñÑüÜ¡¿]*$/.test(bio)) {
				reply.status(400).send({ error: 'Bio contains invalid characters' });
				return;
			}

			const response = await fetch('http://dataBase:3000/patch/bio', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bio, id: user.id })

			});
			if (!response.ok) {
				server.log.error(`ModifyBioEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			console.log(`Bio updated for user ${user.id}`);
			reply.send({ message: 'Bio updated successfully' });
		});
	}
}

export class ModifyPseudoEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`ModifyPseudoEndpoint: ${this.path} called`);
			const user = request.user;
			const pseudo = request.body.pseudo;
			if (!pseudo) {
				reply.status(400).send({ error: 'Pseudo is required' });
				return;
			}

			if (pseudo.trim().length === 0) {
				reply.status(400).send({ error: 'Pseudo cannot be only whitespace' });
				return;
			}
			if (!/^[\w .,!?'"@#&()\-:;\/\\\[\]{}|<>€£$%^*+=~`àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜáéíóúÁÉÍÓÚñÑüÜ¡¿Ç]*$/.test(pseudo)) {
				reply.status(400).send({ error: 'Pseudo contains invalid characters' });
				return;
			}

			if (pseudo.length < 3) {
				reply.status(400).send({ error: 'Pseudo must be at least 3 characters' });
				return;
			}

			if (pseudo.length > 20) {
				reply.status(400).send({ error: 'Pseudo must be less than 20 characters' });
				return;
			}
			

			const response = await fetch('http://dataBase:3000/patch/pseudo', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pseudo, id: user.id })

			});
			if (!response.ok) {
				server.log.error(`ModifyPseudoEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Pseudo already exist` });
				return;
			}
			console.log(`Pseudo updated for user ${user.id}`);
			reply.send({ message: 'Pseudo updated successfully' });
		});
	}
}

export class DeleteUserEndpoint extends Endpoint {
	add(server: any): void {
		server.delete(this.path, { preHandler: server.authenticate }, async (request: any, reply: any) => {
			console.log(`DeleteUserEndpoint: ${this.path} called`);
			const user = request.user;
			const response = await fetch(`http://dataBase:3000/delete/user`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: user.id })
			});
			if (!response.ok) {
				server.log.error(`DeleteUserEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const response2 = await fetch(`http://dataBase:3000/delete/profile`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: user.id })
			});
			if (!response2.ok) {
				server.log.error(`DeleteUserEndpoint: ${this.errorMsg} - `, response2.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const response3 = await fetch(`http://dataBase:3000/delete/friendships`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: user.id, friendId: user.id})
			});
			if (!response3.ok) {
				server.log.error(`DeleteUserEndpoint: ${this.errorMsg} - `, response3.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			console.log(`User ${user.id} deleted successfully`);
			reply.clearCookie('token', {
				httpOnly: true,
				secure: true,      // à mettre sur true en production (HTTPS)
				sameSite: 'lax',
			})
			.send({ message: 'User deleted successfully' });
		});
	}
}

export class LogInEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, async (request:any, reply:any) => {
			console.log(`LogInEndpoint: ${this.path} called`);
			const name = request.body.name;
			const pass = request.body.pass;

			const response = await fetch(`http://dataBase:3000/get/user?user=${name}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`LogInEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();

			console.log(request.body);

			console.log(data);
			if (data.length === 0) {
				reply.status(404).send({ error: 'User not found' });
				return;
			}
			const id = data[0].id;
			console.log(data[0].pass, pass);

			if (pass === data[0].pass) { // Remplace par une vraie vérification de mot de passe
				const token = server.jwt.sign({ id });

				console.log(`User ${name} logged in successfully, token: ${token}`);
				reply.setCookie('token', token, {
					httpOnly: true,
					secure: true,      // à mettre sur true en production (HTTPS)
					sameSite: 'lax',
					path: '/',
					maxAge: 3600 * 24 * 30       // 1 mes
				})
				.send({ success: true });
			} else {
				reply.status(401).send({ error: 'Invalid credentials' });
			}
		});
	}
}

export class ProfileEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (request:any, reply:any) => {
			console.log(`ProfileEndpoint: ${this.path} called`);
			console.log('Cookies reçus:', request.cookies);
  			console.log('Utilisateur JWT:', request.user);
			const user = request.user;
			reply.send({ name: user.id });
		});
	}
}

import { randomUUID } from "crypto";
export class CreateUserEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			console.log(`CreateUserEndpoint: ${this.path} called`);
			const name = request.body.name;
			const pass = request.body.pass;
			if (!name || !pass) {
				reply.status(400).send({ error: 'Name and password are required' });
				return;
			}

			const response = await fetch(`http://dataBase:3000/get/user_id?name=${name}`, {
				method: 'GET'});
			if (!response.ok) {
				server.log.error(`SeeProfileEndpoint: ${this.errorMsg} - `, response.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const data = await response.json();
			if (data.length > 0) {
				reply.status(404).send({ error: "User already exist" });
				return;
			}


			const postUserResponse = await fetch('http://dataBase:3000/post/user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, pass })
			});
			if (!postUserResponse.ok) {
				server.log.error(`CreateUserEndpoint: ${this.errorMsg} - `, postUserResponse.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}

			const idResponse = await fetch(`http://dataBase:3000/get/user_id?user=${name}`, {
				method: 'GET'});
			if (!idResponse.ok) {
				server.log.error(`SeeProfileEndpoint: ${this.errorMsg} - `, idResponse.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}
			const idData = await idResponse.json();
			const id = idData[0]?.id || null;
			if (!id) {
				reply.status(404).send({ error: 'User not found' });
				return;
			}

			const defaultPseudo = "user-" + randomUUID().slice(0, 6); // user-a1b2c3
			const postProfileResponse = await fetch('http://dataBase:3000/post/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, pseudo: defaultPseudo })
			});
			if (!postProfileResponse.ok) {
				server.log.error(`CreateUserEndpoint: ${this.errorMsg} - `, postProfileResponse.statusText);
				reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
				return;
			}

			console.log(`User ${name} created successfully with ID ${id}`);
			reply.send({ message: 'User created successfully'});
		});
	}
}