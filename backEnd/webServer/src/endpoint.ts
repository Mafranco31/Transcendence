import path from 'node:path';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
//import { fileURLToPath } from 'url';
import { promises as fs } from 'node:fs';

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

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

const pages: Array<string> = ["login", "signin", "profile", "home", "game", "tournament", "localgame", "friend_profile", "404", "405", "local_tournament", "input_local", "players_local"];

export class AccessLoginEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			let cred = await isAuthentified(request);
			if (cred)
			{
				reply.status(405)
			}
			const filePath = path.join('website/dist/components', `login.html`);
			console.log("The file path:", filePath)
			const data = await fs.readFile(filePath, 'utf-8');
			//console.log('File found:', data);
			reply.header('Content-Disposition', 'filename="login.html"');
			reply.type('text/html; charset=utf-8');
			reply.send(data);
		});
	}
}

export class AccessSigninEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			let cred = await isAuthentified(request);
			if (cred)
			{
				reply.status(405)
			}
			const filePath = path.join('website/dist/components', `signin.html`);
			console.log("The file path:", filePath)
			const data = await fs.readFile(filePath, 'utf-8');
			//console.log('File found:', data);
			reply.type('text/html; charset=utf-8')
			reply.send(data);
		});
	}
}

// A simple function to parse a cookie header string into an object
function parseCookies(cookieHeader: string | undefined): { [key: string]: string } {
	const cookies: { [key: string]: string } = {};

	if (cookieHeader) {
		cookieHeader.split(';').forEach(cookie => {
			const parts = cookie.match(/(.*?)=(.*)$/)
			if (parts) {
				const key = parts[1].trim();
				const value = (parts[2] || '').trim();
				cookies[key] = value;
			}
		});
	}

	return cookies;
}

async function isAuthentified (request: any): Promise<boolean>
{
	const cookies = parseCookies(request.headers.cookie);
	const token: string | undefined = cookies.token;
	let cred = false;
	try
	{
		//console.log("The token:");
		//console.log(token);
		let response = await fetch(`http://userAuthentication:3000/userauthentication/front/get/profile_session_with_token?token=${token}`, {
			method: 'GET',
		});
		let data = await response.json();
		if (response.ok)
		{
			console.log(data.id)
			cred = true;
		}
	}
	catch (error: unknown)
	{
		if (error instanceof Error)
		{
			console.error("Error:", error.message);
		}
		else
			console.log("there's an error.");
	}
	return (cred);
}

export class AccessComponentEndpoint extends Endpoint {
	add(server: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			//console.log(`AccessComponent endpoint: ${this.path} called`);
			const requestedFile = request.params.name;
			//console.log("raw cookie:");
			//console.log(request.headers.cookie);
			let cred = await isAuthentified(request);
			if (cred) //Has credentials fet
			{
				console.log('User has credentials.');
				console.log('File:', requestedFile);
				if (pages.includes(requestedFile))
				{
					const filePath = path.join('website/dist/components', `${requestedFile}.html`);
					console.log("The file path:", filePath)
					try {
						const data = await fs.readFile(filePath, 'utf-8');
						//console.log('File found:', data);
						reply.type('text/html; charset=utf-8')
						reply.send(data);
					}
					catch (error: unknown)
					{
						if (error instanceof Error)
						{
							console.error("Error:", error.message);
						}
						else
							console.log("there's an error.");
					}
					//const response = await fetch('../website/dist/components/'.concat(requestedFile).concat('.html'), {
					//	method: 'GET'});
					//const data = await response.json();
				}
				else
				{
					console.log('File not found.');
					reply.status(404).send({ error: `404 Not Found` });
					return;
				}
			}
			else //Doesn't have credentials
			{
				console.log('User doesnt have credentials.');
				console.log('File:', requestedFile);
				if (requestedFile == "login" || requestedFile == "signin" || requestedFile == "404" || requestedFile == "405")
				{
					const filePath = path.join('website/dist/components', `${requestedFile}.html`);
					console.log("The file path:", filePath)
					try {
						const data = await fs.readFile(filePath, 'utf-8');
						//console.log('File found:', data);
						reply.type('text/html; charset=utf-8')
						reply.send(data);
					}
					catch (error: unknown)
					{
						if (error instanceof Error)
						{
							console.error("Error:", error.message);
						}
						else
							console.log("there's an error.");
					}
					//const response = await fetch('../website/dist/components/'.concat(requestedFile).concat('.html'), {
					//	method: 'GET'});
					//const data = await response.json();
				}
				else if (pages.includes(requestedFile))
				{
					reply.status(405);
				}
			}

		});
	}
}

export class PostAvatarEndpoint extends Endpoint {
	add (server: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			let hashedId: string | null = null;
			let imageBuffer: Buffer | null = null;

			try {
				const parts = request.parts();
				for await (const part of parts) {
					if (part.type === 'field' && part.fieldname === 'hashedId')
						hashedId = part.value as string;
					if (part.type === 'file' && part.fieldname === 'avatar')
						imageBuffer = await part.toBuffer();
				}

				if (!hashedId || !imageBuffer) {
					console.error("Missing hashedId or imageBuffer after processing parts.");
					return reply.status(400).send({ error: "Incomplete form data: hashedId and avatar file are required." });
				}
				
				const avatarsDir = path.join('website', 'public', 'avatars');
				const filePath = path.join(avatarsDir, hashedId + ".jpg");

				console.log(`Writing avatar for hash ${hashedId} to ${filePath}`);

				await fs.mkdir(avatarsDir, { recursive: true });
				await fs.writeFile(filePath, imageBuffer);

				reply.send({ message: "Avatar uploaded successfully" });

			} catch (error) {
				console.error("Error during multipart processing or file writing:", error);
				reply.status(500).send({ error: "Internal Server Error" });
			}
		});
	};
}

export class DeleteAvatarEndpoint extends Endpoint {
	add (server: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			try {
				const { filePath } = request.body;

				if (!filePath || typeof filePath !== 'string') {
					return reply.status(400).send({ error: "filePath is missing or invalid" });
				}

				const fullPath = path.join('website', filePath);
				const normalizedPath = path.normalize(fullPath);
				const allowedDir = path.normalize(path.join('website', 'public', 'avatars'));

				if (!normalizedPath.startsWith(allowedDir) || path.basename(normalizedPath) === 'default_avatar.jpg') {
					return reply.status(403).send({ error: "Forbidden" });
				}
				
				await fs.unlink(normalizedPath);
				
				reply.send({ message: "Avatar deleted successfully" });

			} catch (error: any) {
				if (error.code === 'ENOENT') {
					return reply.status(404).send({ error: "File not found" });
				}
				
				console.error("Error deleting avatar:", error);
				reply.status(500).send({ error: "Internal Server Error" });
			}
		});
	};
}
