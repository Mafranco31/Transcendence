import * as EndPoints from './endpoint'
import FormBodyPlugin from '@fastify/formbody';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';


// import bcrypt from 'bcrypt';

const server = Fastify({
	logger: true 
});

function setEndPoints(): void {

	new EndPoints.SeeAllUsersEndpoint(
		"/usermanagement/front/get/users",
		"Failed to retrieve users"
	);

	new EndPoints.SeeAllProfilesEndpoint(
		"/usermanagement/front/get/profiles",
		"Failed to retrieve users"
	);

	new EndPoints.SeeAllFriendsEndpoint(
		"/usermanagement/front/get/friendships",
		"Failed to retrieve users"
	);

	new EndPoints.SeeProfileEndpoint(
		"/usermanagement/front/get/profile",
		"Failed to retrieve user profile"
	);
	
	new EndPoints.SeePseudosEndpoint(
		"/usermanagement/front/get/pseudos",
		"Failed to retrieve pseudos"
	);

	new EndPoints.GetMatchListEndpoint(
		"/usermanagement/front/get/matchlist",
		"Failed to retrieve match list"
	);

	new EndPoints.GetFriendMatchListEndpoint(
		"/usermanagement/front/get/friend_matchlist",
		"Failed to retrieve friend match list"
	)

	new EndPoints.CreateUserEndpoint(
		"/usermanagement/front/post/create",
		"Failed to create user"
	);

	new EndPoints.CreateFriendshipEndpoint(
		"/usermanagement/front/post/friendship",
		"Failed to create friendship"
	);

	new EndPoints.SeeFriendIdEndpoint(
		"/usermanagement/front/get/friend_id",
		"Failed to retrieve friendship status"
	);

	new EndPoints.SeeUserFriendshihpsEndpoint(
		"/usermanagement/front/get/userfriendships",
		"Failed to retrieve user friendships"
	);

	new EndPoints.SeeFriendProfileEndpoint(
		"/usermanagement/front/get/friend_profile",
		"Failed to retrieve user friendships"
	);

	new EndPoints.SeeFriendshihpsPendingEndpoint(
		"/usermanagement/front/get/friendships_pending",
		"Failed to retrieve pending friendships"
	);

	new EndPoints.AcceptFriendshipEndpoint(
		"/usermanagement/front/patch/accept_friendship",
		"Failed to accept friendship"
	);

	new EndPoints.SeeFriendshihpsAcceptedEndpoint(
		"/usermanagement/front/get/friendships_accepted",
		"Failed to retrieve accepted friendships"
	);

	new EndPoints.BlockFriendshipEndpoint(
		"/usermanagement/front/patch/block_friendship",
		"Failed to block friendship"
	);

	new EndPoints.SeeFriendshihpsBlockedEndpoint(
		"/usermanagement/front/get/friendships_blocked",
		"Failed to retrieve blocked friendships"
	);

	new EndPoints.DeleteFriendshipEndpoint(
		"/usermanagement/front/delete/delete_friendship",
		"Failed to delete friendship"
	);
	

	new EndPoints.LogInEndpoint(
		"/usermanagement/front/post/login",
		"Failed to log in user"
	);

	new EndPoints.ProfileEndpoint(
		"/usermanagement/front/get/profile_session",
		"Failed to retrieve user profile"
	);

	new EndPoints.ModifyBioEndpoint(
		"/usermanagement/front/put/modify_bio",
		"Failed to modify user bio"
	);

	new EndPoints.ModifyPseudoEndpoint(
		"/usermanagement/front/put/modify_pseudo",
		"Failed to modify user pseudo"
	);

	new EndPoints.ModifyAvatarEndpoint(
		"/usermanagement/front/patch/modify_avatar",
		"Failed to modify user avatar"
	);

	new EndPoints.DeleteAvatarEndpoint(
		"/usermanagement/front/delete/delete_avatar",
		"Failed to delete user avatar"
	);

	new EndPoints.DeleteUserEndpoint(
		"/usermanagement/front/delete/user",
		"Failed to delete user"
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
		await server.register(multipart);
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

		setEndPoints();
		await server.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}

start();