import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import * as EndPoints from './endpoint.js';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import multipart from '@fastify/multipart';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
	logger: false // It's good practice to enable logging
});

const staticPath = path.join(__dirname, '..', 'website');
console.log(`[DEBUG] Serving static files from: ${staticPath}`);

//    Serves files from the 'public' directory
server.register(fastifyStatic, {
	root: path.join(__dirname, '..', 'website'),
	// Optional: All other fastify-static options can be specified here
});



server.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
	// The client-side router will handle the 404
	return reply.sendFile('index.html');
});

function setEndPoints(): void {

	/*	Create EndPoints Here 
	
	new EndPoints.SeeAllUsersEndpoint(
		"/usermanagement/front/get/users",
		"Failed to retrieve users"
	);
	
	*/
	//examples
	new EndPoints.AccessComponentEndpoint(
		"/components/:name",
		"Unknown error."
	);

	new EndPoints.AccessLoginEndpoint(
		"/access/login",
		"Unknown error."
	);

	new EndPoints.AccessSigninEndpoint(
		"/access/signin",
		"Unknown error."
	);
	
	// new EndPoints.AccessProfileEndpoint(
	// 	"/access/profile",
	// 	"Unknown error."
	// );

	new EndPoints.PostAvatarEndpoint(
		"/post/avatar",
		"Failed to upload avatar"
	);

	new EndPoints.DeleteAvatarEndpoint(
		"/delete/avatar",
		"Failed to delete avatar"
	);

	EndPoints.Endpoint.enableAll(server);
}

async function start() {
	try {
		//console.log(path.dirname);
		// await server.register(fastifyCookie);
		// await server.register(fastifyJwt, {
		// 	secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eeyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0zzafemlzfzeanflzanlfknzaelnflzakenflkdFAZEGreglrngAEg12345grlek3124dsqknZA1234lkqndv231dfqdsklnlaez2134geklrnbp', // TODO put in a .env file
		// 	cookie: {
		// 		cookieName: 'token',
		// 		signed: false
		// 	}
		// });
		// server.decorate("authenticate", async (request:any, reply:any) => {
		// 	try {
		// 		await request.jwtVerify();
		// 		console.log("User authenticated");
		// 	} catch (err) {
		// 		console.log(request.cookies.token);
		// 		reply.status(401).send({ error: 'Unauthorized' });
		// 	}
		// });
		await server.register(multipart);
		setEndPoints();
		// Supprime les headers problématiques pour Google Sign-In
		// server.addHook('onSend', async (request, reply, payload) => {
		// 	reply.header('Cross-Origin-Opener-Policy', 'unsafe-none'); // Ou reply.removeHeader('...')
		// 	reply.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
		// 	return payload;
		// });


		await server.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		//server.log.error(err);
		process.exit(1);
	}
}

start();
