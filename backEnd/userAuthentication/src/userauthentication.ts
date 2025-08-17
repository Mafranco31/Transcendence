import * as EndPoints from './endpoint'
import FormBodyPlugin from '@fastify/formbody';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';

const server = Fastify({
	logger: true 
});

function setEndPoints(): void {

	/*	Create EndPoints Here 
	
	new EndPoints.SeeAllUsersEndpoint(
		"/usermanagement/front/get/users",
		"Failed to retrieve users"
	);
	
	*/

	new EndPoints.ProfileEndpoint(
		"/userauthentication/front/get/profile_session_with_token",
		"Failed to retrieve user profile"
	);	
	

	new EndPoints.CreateUserEndpoint(
		"/userauthentication/front/post/create",
		"Failed to create user"
	);

	new EndPoints.GoogleAuthEndpoint(
		"/userauthentication/front/post/google_connect",
		"Failed to connect user with Google",
	);

	new EndPoints.LogOutEndpoint(
		"/userauthentication/front/post/logout",
		"Failed to log out user"
	);

	new EndPoints.LogInEndpoint(
		"/userauthentication/front/post/login",
		"Failed to log in user"
	);

	new EndPoints.SeeAllUsersEndpoint(
		"/userauthentication/front/get/users",
		"Failed to retrieve users"
	);

	new EndPoints.WebSocketStatusEndpoint(
    	"/userauthentication/front/ws/status",
    	"Failed to handle websocket status"
  	);

	new EndPoints.TwoFASetupEndpoint(
		"/userauthentication/front/post/2fa/setup",
		"Failed to setup 2FA"
	);

	new EndPoints.TwoFAEnableEndpoint(
		"/userauthentication/front/post/2fa/enable",
		"Failed to enable 2FA"
	);

	new EndPoints.TwoFADeleteEndpoint(
		"/userauthentication/front/patch/2fa/delete",
		"Failed to delete 2FA"
	);

	new EndPoints.TwoFALoginEndpoint(
		"/userauthentication/front/post/2fa/login",
		"Failed to log in with 2FA"
	);

	new EndPoints.TwoFAStatusEndpoint(
		"/userauthentication/front/get/2fa/status",
		"Failed to retrieve 2FA status"
	);

	EndPoints.Endpoint.enableAll(server);
}

function env(name: string, fallback?: string): string {
	const v = process.env[name];
	if (v === undefined) {
		if (fallback !== undefined) return fallback;
		throw new Error(`Missing env var ${name}`);
	}
	return v;
}

async function start() {

	try {
		await server.register(FormBodyPlugin);
		await server.register(cors, {
			origin: 'https://localhost',
			credentials: true
		});
		await server.register(fastifyCookie);
		const jwtSecret = env('JWT_SECRET');
		await server.register(fastifyJwt, {
			// secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eeyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0zzafemlzfzeanflzanlfknzaelnflzakenflkdFAZEGreglrngAEg12345grlek3124dsqknZA1234lkqndv231dfqdsklnlaez2134geklrnbp', // TODO put in a .env file
			secret: jwtSecret,
			cookie: {
				cookieName: 'token',
				signed: false
			}
		});
		server.decorate("authenticate", async (request:any, reply:any) => {
			try {
				const payload = await request.jwtVerify();

				if (payload.twofa) {
					return reply.status(401).send({ error: "2FA verification required" });
				}

				console.log("User authenticated");
			} catch (err) {
				console.log(request.cookies.token);
				reply.status(401).send({ error: 'Unauthorized' });
			}
		});
		
		await server.register(fastifyWebsocket);

		setEndPoints();
		await server.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}

start();
