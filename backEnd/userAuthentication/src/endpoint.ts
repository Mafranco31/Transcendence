const bcrypt = require('bcrypt');

import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from "crypto";


function env(name: string, fallback?: string): string {
	const v = process.env[name];
	if (v === undefined) {
		if (fallback !== undefined) return fallback;
		throw new Error(`Missing env var ${name}`);
	}
	return v;
}
  

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


// User Status Management
const connectedUsers = new Map<string, Set<any>>();

async function broadcast(id: string, status: boolean): Promise<void> {

	const responseModifyStatus = await fetch(`http://dataBase:3000/patch/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status, id })
	});
	if (!responseModifyStatus.ok) {
		console.error(`Failed to update status for user ${id}:`, responseModifyStatus.statusText);
		return;
	}

	const response = await fetch(
		`http://dataBase:3000/get/friends_user?id1=${id}&id2=${id}&id3=${id}&id4=${id}&id5=${id}`,
		{ method: 'GET' }
	);

	if (!response.ok) {
		console.error(`Failed to retrieve friends for user ${id}:`, response.statusText);
		return;
	}

	const friends = await response.json();
	const friendsIds = friends.map((friend: { id: string }) => friend.id);
	console.log(`friends of ${id}: ${friendsIds}`);

	if (friendsIds.length === 0) {
		console.log(`No friends found for user ${id}`);
		return;
	}

	for (const userId of friendsIds) {
		const userSockets = connectedUsers.get(String(userId));
		if (userSockets && userSockets.size > 0) {
		for (const socket of userSockets) {
			socket.send(JSON.stringify({ id, status }));
			console.log(`Message sent to ${userId}`);
		}
		} else {
		console.log(`No socket found for user ${userId}`);
		}
	}
}

export class WebSocketStatusEndpoint extends Endpoint {
  add(server: any): void {
    server.get(this.path, { websocket: true }, async (socket: any, req: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");
      if (!userId) {
        socket.close(1008, "Missing userId parameter");
        return;
      }

      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
        broadcast(userId, true);
      }

      connectedUsers.get(userId)!.add(socket);

      console.log(`New connexion WebSocket for userId: ${userId} (total onglets: ${connectedUsers.get(userId)!.size})`);

      socket.on('close', () => {
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket);

          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
            broadcast(userId, false);
            console.log(`Last close for userId: ${userId} → Disconnected`);
          } else {
            console.log(`Close for userId: ${userId} (remain ${userSockets.size} pages)`);
          }
        }
      });
    });
  }
}


export class ProfileEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request:any, reply:any) => {
			const token = request.query.token
			console.log(`Token received: ${token}`);
			try {
				const decoded = server.jwt.verify(token);
				console.log('Decoded token:', decoded);
				reply.send({ id: decoded.id });
			} catch (err) {
				reply.status(401).send({ error: 'Invalid token' });
				return;
			}			
		});
	}
}

export class SeeAllUsersEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			console.log(`SeeAllUsersEndpoint: ${this.path} called`);
			const response = await fetch('http://dataBase:3000/get/users', {
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

export class GoogleAuthEndpoint extends Endpoint {
	private googleClient: OAuth2Client;

	constructor(path: string, errorMsg: string) {
		super(path, errorMsg);
		// this.googleClient = new OAuth2Client("826866714242-u7rb76no703g0n8vauoq926n9cdkfgv3.apps.googleusercontent.com");//TODO: Move to .env file
		const googleApiSecret = env('GOOGLE_API_SECRET');
		this.googleClient = new OAuth2Client(googleApiSecret); // Use environment variable for client ID
		Endpoint.list.add(this);
	}
	
	add(server: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			const token = request.body.credential;
			if (!token) {
				reply.status(400).send({ error: 'Missing credential' });
				return;
			}

			try {
				const ticket = await this.googleClient.verifyIdToken({
					idToken: token,
					audience: this.googleClient._clientId
				});
				const payload = ticket.getPayload();
				if (!payload || !payload.email) {
					reply.status(401).send({ error: 'Invalid Google token' });
					return;
				}

				const userEmail = payload.email;

				// Vérifie si l'utilisateur existe déjà dans la base
				const response = await fetch(`http://dataBase:3000/get/user?user=${userEmail}`);
				let data = await response.json();
				let created = false;

				if (data.length === 0) {
					created = true;
					// Crée un nouvel utilisateur si inexistant
					await fetch(`http://dataBase:3000/post/user`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							user: userEmail,
							pass: '', // Pas de mot de passe pour les utilisateurs Google
							login_method: 'google'
						})
					});
					
				}

				const idResponse = await fetch(`http://dataBase:3000/get/user_id?user=${userEmail}`, {
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

				if (created) {
					const defaultPseudo =  "user-" + randomUUID().slice(0, 6);
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

					console.log(`User ${userEmail} created successfully with ID ${id}`);
					// reply.send({ message: 'User created successfully'});
				} else if (data[0].two_fa) {
					const token = server.jwt.sign({ id, twofa: true }, { expiresIn: '5m' });

					console.log(`User ${id} requires 2FA verification`);
					reply.send({ token, twofaRequired: true });
					return;
				}


				const tokenJwt = server.jwt.sign({ id });

				reply.setCookie('token', tokenJwt, {
					httpOnly: true,
					secure: true,
					sameSite: 'lax',
					path: '/',
					maxAge: 3600
				}).send({ success: true });

			} catch (err) {
				server.log.error('Google login failed', err);
				reply.status(401).send({ error: 'Authentication failed' });
			}
		});
	}
}

export class LogOutEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			console.log(`LogOutEndpoint: ${this.path} called`);

			// Efface le cookie en le remplaçant par un vide et maxAge 0
			reply
				.clearCookie('token', {
					httpOnly: true,
					secure: true, // à garder pour production
					sameSite: 'lax',
					path: '/',
					maxAge: 0 // Efface le cookie immédiatement
				})
				.send({ success: true, message: 'Logged out successfully' });
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
				reply.status(404).send({ error: 'Invalid username or password' });
				return;
			}
			if (data[0].login_method !== 'local') {
				reply.status(403).send({ error: 'Please connect using Google Sign-In' });
				return;
			}
			console.log(data[0].pass, pass);

			const isValidPassword = await bcrypt.compare(pass, data[0].pass);

			if (!isValidPassword) {
				reply.status(401).send({ error: 'Invalid username or password' });
				return;
			}

			const id = data[0].id;
			const two_fa = data[0].two_fa;
		
			if (two_fa) {
				const token = server.jwt.sign({ id, twofa: true }, { expiresIn: '5m' });

				console.log(`User ${name} requires 2FA verification`);
				reply.send({ token, twofaRequired: true });
			}
			else {
				const token = server.jwt.sign({ id });

				console.log(`User ${name} logged in successfully, token: ${token}`);
				reply.setCookie('token', token, {
					httpOnly: true,
					secure: true,
					sameSite: 'lax',
					path: '/',
					maxAge: 3600
				})
				.send({ success: true });
			}
		});
	}
}

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
			if (name.length < 3 || name.length > 20) {
				console.error(`CreateUserEndpoint: ${this.errorMsg} - Name length is invalid`);
				reply.status(400).send({ error: 'Name must be between 3 and 20 characters' });
				return;
			}
			if (pass.length < 6 || pass.length > 20) {
				console.error(`CreateUserEndpoint: ${this.errorMsg} - Password length is invalid`);
				reply.status(400).send({ error: 'Password must be between 6 and 20 characters' });
				return;
			}
			if (!/^[a-zA-Z0-9@._-]+$/.test(name)) {
				console.error(`CreateUserEndpoint: ${this.errorMsg} - Name contains invalid characters`);
				reply.status(400).send({ error: 'Name can only contain alphanumeric characters, @, ., _ and -' });
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

			const saltRounds = 10;
			try {
				const hashedPassword = await bcrypt.hash(pass, saltRounds);

				const postUserResponse = await fetch('http://dataBase:3000/post/user', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name, hashedPassword, login_method: 'local' })
				});
				if (!postUserResponse.ok) {
					server.log.error(`CreateUserEndpoint: ${this.errorMsg} - `, postUserResponse.statusText);
					reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
					return;
				}
			} catch (err) {
				server.log.error(`CreateUserEndpoint: ${this.errorMsg} - `, err);
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


			const defaultPseudo =  "user-" + randomUUID().slice(0, 6);
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

// 2FA
import speakeasy from "speakeasy";
import qrcode from "qrcode";

const pending2FA: Record<string, string> = {};

export class TwoFASetupEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, { preHandler: server.authenticate }, async (req: any, reply: any) => {
			const user = req.user;

			if (pending2FA[user.id]) {
				return reply.status(400).send({ error: "2FA setup already in progress" });
			}

			// Vérifier si l'utilisateur a déjà la 2FA activée
			const response = await fetch(`http://dataBase:3000/get/userfa?id=${user.id}`);
			if (!response.ok) {
				console.error(`Failed to fetch user data for 2FA setup: ${response.statusText}`);
				return reply.status(500).send({ error: "Failed to fetch user data" });
			}
			const userData = await response.json();
			if (userData[0].two_fa) {
				return reply.status(400).send({ error: "2FA is already enabled for this user" });
			}

			// Générer un secret TOTP
			const secret = speakeasy.generateSecret({
				name: "Transcendence", // Nom affiché dans l’app Google Authenticator
				length: 20
			});

			pending2FA[user.id] = secret.base32;

			// Générer un QR code pour l’app Authenticator
			const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!);
			console.log(`2FA setup initiated for user ${user.id}, secret: ${secret.base32}`);

			reply.send({
				message: "Scan this QR code with Google Authenticator",
				qrCode: qrCodeDataURL,
				manualKey: secret.base32
			});
		});
	}
}

export class TwoFAEnableEndpoint extends Endpoint {
	add(server: any): void {
		server.post(this.path, { preHandler: server.authenticate }, async (req: any, reply: any) => {
			const user = req.user;
			const token = req.body.google_token;

			const secret = pending2FA[user.id];
			if (!secret) {
				return reply.status(400).send({ error: "No 2FA setup in progress" });
			}

			if (!token) {
				console.error(`2FA token is missing for user ${user.id}`);
				return reply.status(400).send({ error: "Missing 2FA token" });
			}
			if (token.length !== 6 || !/^\d+$/.test(token)) {
				console.error(`Invalid 2FA token format for user ${user.id}`);
				return reply.status(400).send({ error: "Invalid 2FA token format" });
			}

			const verified = speakeasy.totp.verify({
				secret,
				encoding: "base32",
				token,
				window: 1
			});

			if (!verified) {
				console.error(`Invalid 2FA token for user ${user.id}`);
				return reply.status(400).send({ error: "Invalid 2FA token" });
			}

			// ✅ Activer la 2FA dans la DB
			const resUpdateStatus = await fetch(`http://dataBase:3000/patch/2fa`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ two_fa: true, two_fa_secret: secret, id: user.id })
			});
			if (!resUpdateStatus.ok) {
				console.error(`Failed to update 2FA status for user ${user.id}`);
				return reply.status(500).send({ error: "Internal server error" });
			}

			console.log(`2FA enabled for user ${user.id}`);

			delete pending2FA[user.id];

			reply.send({ success: true, message: "2FA enabled successfully" });
		});
	}
}

export class TwoFADeleteEndpoint extends Endpoint {
	add(server: any): void {
		server.patch(this.path, { preHandler: server.authenticate }, async (req: any, reply: any) => {
			const user = req.user;

			// Vérifier si l'utilisateur a la 2FA activée
			const response = await fetch(`http://dataBase:3000/get/userfa?id=${user.id}`);
			if (!response.ok) {
				console.error(`Failed to fetch user data for 2FA deletion: ${response.statusText}`);
				return reply.status(500).send({ error: "Internal server error" });
			}
			const userData = await response.json();
			if (!userData[0].two_fa){
				console.error(`User ${user.id} does not have 2FA enabled`);
				return reply.status(400).send({ error: "2FA is not enabled for this user" });
			}

			// Désactiver la 2FA dans la DB
			const resUpdateStatus = await fetch(`http://dataBase:3000/patch/2fa`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ two_fa: false, two_fa_secret: null, id: user.id })
			});
			if (!resUpdateStatus.ok) {
				console.error(`Failed to update 2FA status for user ${user.id}`);
				return reply.status(500).send({ error: "Internal server error" });
			}

			console.log(`2FA disabled for user ${user.id}`);

			reply.send({ success: true, message: "2FA disabled successfully" });
		});
	}
}


export class TwoFALoginEndpoint extends Endpoint {
  add(server: any): void {
    server.post(this.path, async (req: any, reply: any) => {
      console.log(`LogIn2FAEndpoint: ${this.path} called`);
      const { tempToken, google_token } = req.body;

	  console.log(`tempToken: ${tempToken}, google_token: ${google_token}`);

      if (!tempToken || !google_token) {
        return reply.status(400).send({ error: "Missing tempToken or google_token" });
      }

      // ✅ Vérifie le token temporaire
      let payload;
      try {
        payload = server.jwt.verify(tempToken);
      } catch (err) {
        console.error("Invalid or expired temp token", err);
        return reply.status(401).send({ error: "Invalid or expired temp token" });
      }

      // ✅ Vérifie que c’est bien un token temporaire de 2FA
      if (!payload.twofa || !payload.id) {
        return reply.status(401).send({ error: "Invalid 2FA flow" });
      }

      const userId = payload.id;

	  console.log(`2FA login for user ID: ${userId}`);

      // ✅ Récupère l'utilisateur avec son secret TOTP
      const response = await fetch(`http://dataBase:3000/get/userfa?id=${userId}`);
      if (!response.ok) {
        console.error(`Failed to fetch user ${userId} for 2FA login`);
        return reply.status(500).send({ error: "Internal server error" });
      }

      const userData = await response.json();
	  if (userData.length === 0) {
		console.error(`User ${userId} not found for 2FA login`);
		return reply.status(404).send({ error: "User not found" });
	  }

      const secret = userData[0].two_fa_secret;
	  const two_fa = userData[0].two_fa;

	  console.log(`2FA login for user ${userId}, secret: ${secret}, two_fa: ${two_fa}`);

      if (!two_fa) {
        return reply.status(400).send({ error: "2FA not enabled for this user" });
      }

      // ✅ Vérifie le code Google Authenticator
      const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token: google_token,
        window: 1
      });

      if (!verified) {
        console.error(`Invalid 2FA token for user ${userId}`);
        return reply.status(401).send({ error: "Invalid 2FA code" });
      }

      // ✅ Si correct → Génère un JWT final et le renvoie
      const finalToken = server.jwt.sign({ id: userId });

      console.log(`User ${userId} successfully completed 2FA login`);

      reply.setCookie("token", finalToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 3600 * 24 * 30 * 3
      }).send({ success: true });
    });
  }
}

export class TwoFAStatusEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, { preHandler: server.authenticate }, async (req: any, reply: any) => {
			const user = req.user;

			// Verify if 2FA is enabled for the user
			const response = await fetch(`http://dataBase:3000/get/2fastatus?id=${user.id}`);
			if (!response.ok) {
				console.error(`Failed to fetch user data for 2FA status: ${response.statusText}`);
				return reply.status(500).send({ error: "Internal server error" });
			}
			const userData = await response.json();
			if (userData.length === 0) {
				return reply.status(404).send({ error: "User not found" });
			}

			reply.send({ two_fa: userData[0].two_fa });
		});
	}
}