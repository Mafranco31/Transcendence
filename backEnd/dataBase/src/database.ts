import Fastify from 'fastify';
import FormBodyPlugin from '@fastify/formbody';
import * as SQLite3 from 'sqlite3'; 
import * as EndPoints from './endpoint'

let db: SQLite3.Database;
const server = Fastify({
	logger: true 
});

function connect(): void {
	let dbPath: string = "./data/backendDatabase.db"

	db = new SQLite3.Database(dbPath, (err) => {
		if (err)
			console.error("SQLite error: Database file error - ", err.message);
	});
	console.log("Connected to 'backendDatabase'");

	db.run("UPDATE profiles SET status = 0", (err) => {
		if (err)
			console.error("SQLite error: Failed to reset profile status -", err.message);
		else
			console.log("All profile statuses reset to 0 at startup");
	});
}

function setTables(): void {

	let tables: string[] = [
		`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			pass TEXT NOT NULL,
			two_fa BOOLEAN DEFAULT FALSE,
			two_fa_secret TEXT DEFAULT NULL,
			login_method TEXT DEFAULT 'local' -- local, google
		)`,

		`CREATE TABLE IF NOT EXISTS profiles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			pseudo TEXT UNIQUE DEFAULT NULL,
			bio TEXT DEFAULT '',
			date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			experience INTEGER DEFAULT 0,
			avatar TEXT DEFAULT 'public/avatars/default_avatar.jpg',
			status BOOLEAN NOT NULL DEFAULT 0,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		`CREATE TABLE IF NOT EXISTS friends (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			friend_id INTEGER NOT NULL,
			status TEXT DEFAULT 'pending', -- pending, accepted, blocked
			request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			sender_id INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
			UNIQUE(user_id, friend_id)
		)`,
	
		`CREATE TABLE IF NOT EXISTS matches (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_id INTEGER,
			player0_id INTEGER,
			player0_score INTEGER,
			player1_id INTEGER,
			player1_score INTEGER,
			winner_id INTEGER,
			disconnected BOOLEAN,
			date TEXT DEFAULT (strftime('%d-%m-%Y', 'now', 'localtime')),
			FOREIGN KEY (player0_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		`CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			ranking_1 INTEGER,
			ranking_2 INTEGER,
			ranking_3 INTEGER,
			ranking_4 INTEGER,
			status INTEGER
		)`

		//Add tables here, comma separated.
	
	];

	tables.forEach(table => {
		db.run(table, (err) => {
		if (err)
			console.error("SQLite error: Table creation error - ", err.message);
		});
	}); 
}

function setEndPoints(): void {
	//Add endpoints here

	new EndPoints.getEndpoint(
		"/get/user",
		"SELECT * FROM users WHERE name = ?",
		"Failed to get user id"
	);
  
	new EndPoints.getEndpoint(
		"/get/username",
		"SELECT name FROM users WHERE id = ?",
		"Failed to get user name"
	);

	new EndPoints.getEndpoint(
		"/get/userfa",
		"SELECT two_fa, two_fa_secret FROM users WHERE id = ?",
		"Failed to get user 2FA status"
	);

	new EndPoints.getEndpoint(
		"/get/2fasecret",
		`SELECT two_fa_secret FROM users WHERE id = ?`,
		"Failed to get 2FA secret"
	);

	new EndPoints.getEndpoint(
		"/get/2fastatus",
		`SELECT two_fa FROM users WHERE id = ?`,
		"Failed to get 2FA status"
	);

	new EndPoints.getEndpoint(
		"/get/avatar",
		"SELECT avatar FROM profiles WHERE id = ?",
		"Failed to get user avatar"
	);

	new EndPoints.getEndpoint(
		"/get/profiles",
		"SELECT * FROM profiles",
		"Failed to get profiles"
	);

	new EndPoints.getEndpoint(
		"/get/friends",
		"SELECT * FROM friends",
		"Failed to get friends"
	);

	new EndPoints.getEndpoint(
		"/get/users",
		"SELECT * FROM users",
		"Failed to get users"
	);

	new EndPoints.getEndpoint(
		"/get/pseudos",
		"SELECT pseudo, user_id FROM profiles WHERE pseudo IS NOT NULL AND user_id != ?",
		"Failed to get users"
	);

	new EndPoints.getEndpoint(
		"/get/pseudo",
		"SELECT pseudo as name FROM profiles WHERE user_id = ?",
		"Failed to get users"
	);

	new EndPoints.getEndpoint(
		"/get/user_id",
		`SELECT id from users WHERE name = ?`,
		"Failed to get users"
	);

	new EndPoints.getEndpoint(
		"/get/user_id_from_pseudo",
		`SELECT user_id from profiles WHERE pseudo = ?`,
		"Failed to get users"
	);

	new EndPoints.getEndpoint(
		"/get/profile",
		`SELECT * FROM profiles WHERE user_id = ?`,
		"Failed to get user"
	);

	new EndPoints.getEndpoint(
		"/get/friend_id",
		`SELECT 
			CASE
				WHEN f.user_id = ? THEN f.friend_id
				ELSE f.user_id
			END AS friend_id
		FROM friends f
		WHERE f.id = ?;
				`,
		"Failed to get friendship status"
	);

	new EndPoints.getEndpoint(
		"/get/friendships_pending",
		`SELECT 
		f.id AS id,
		CASE 	
			WHEN f.user_id = ? THEN p2.pseudo
			ELSE p1.pseudo
		END AS pseudo,
		CASE
			WHEN  f.user_id = ? THEN p2.id
			ELSE p1.id
		END AS friend_id
		FROM friends f
		JOIN profiles p1 ON p1.user_id = f.user_id
		JOIN profiles p2 ON p2.user_id = f.friend_id
		WHERE (f.user_id = ? OR f.friend_id = ?)
  		AND f.status = 'pending'
		AND f.sender_id != ?
		`,
		"Failed to get pending friendships"
	);

	new EndPoints.getEndpoint(
		"/get/friendships_accepted",
		`SELECT 
		f.id AS id,
		CASE 	
			WHEN f.user_id = ? THEN p2.pseudo
			ELSE p1.pseudo
		END AS pseudo,
		CASE
			WHEN  f.user_id = ? THEN p2.id
			ELSE p1.id
		END AS friend_id
		FROM friends f
		JOIN profiles p1 ON p1.user_id = f.user_id
		JOIN profiles p2 ON p2.user_id = f.friend_id
		WHERE (f.user_id = ? OR f.friend_id = ?)
  		AND f.status = 'accepted'
		`,
		"Failed to get accepted friendships"
	);
	
	new EndPoints.getEndpoint(
		"/get/friendships_blocked",
		`SELECT 
		f.id AS id,
		CASE 	
			WHEN f.user_id = ? THEN p2.pseudo
			ELSE p1.pseudo
		END AS pseudo,
		CASE
			WHEN  f.user_id = ? THEN p2.id
			ELSE p1.id
		END AS friend_id
		FROM friends f
		JOIN profiles p1 ON p1.user_id = f.user_id
		JOIN profiles p2 ON p2.user_id = f.friend_id
		WHERE (f.user_id = ? OR f.friend_id = ?)
  		AND f.status = 'blocked'
		`,
		"Failed to get blocked friendships"
	);

	new EndPoints.getEndpoint(
		"/get/friends_user",
		`SELECT
		CASE 	
			WHEN f.user_id = ? THEN p2.pseudo
			ELSE p1.pseudo
		END AS pseudo,
		CASE 	
			WHEN f.user_id = ? THEN p2.id
			ELSE p1.id
		END AS id,
		CASE 	
			WHEN f.user_id = ? THEN p2.status
			ELSE p1.status
		END AS status
		FROM friends f
		JOIN profiles p1 ON p1.user_id = f.user_id
		JOIN profiles p2 ON p2.user_id = f.friend_id
		WHERE (f.user_id = ? OR f.friend_id = ?)
  		AND f.status = 'accepted'
		`,
		"Failed to get accepted friendships"
	);

	new EndPoints.getEndpoint(
		"/get/matchs",
		`SELECT
			self_profile.pseudo AS user_pseudo,
			enemy_profile.pseudo AS enemy_pseudo,
			CASE 
				WHEN m.player0_id = self_profile.user_id THEN m.player0_score
				ELSE m.player1_score
			END AS user_score,
			CASE 
				WHEN m.player0_id = self_profile.user_id THEN m.player1_score
				ELSE m.player0_score
			END AS enemy_score,
			CASE 
				WHEN m.player0_id = self_profile.user_id THEN m.player1_id
				ELSE m.player0_id
			END AS enemy_id,
			winner_profile.pseudo AS winner_pseudo,
			m.date AS date
		FROM matches m
		JOIN profiles self_profile ON (m.player0_id = self_profile.user_id OR m.player1_id = self_profile.user_id)
		JOIN profiles enemy_profile ON (
			(m.player0_id = enemy_profile.user_id OR m.player1_id = enemy_profile.user_id)
			AND enemy_profile.user_id != self_profile.user_id
		)
		LEFT JOIN profiles winner_profile ON winner_profile.user_id = m.winner_id
		WHERE self_profile.user_id = ?;
		`,
		"Failed to get matches data"
	);

	new EndPoints.postEndpoint(
		"/post/match",
		"INSERT INTO matches (tournament_id, player0_id, player0_score, player1_id, player1_score, winner_id, disconnected) VALUES (?, ?, ?, ?, ?, ?, ?)",
		"Match data insertion error"
	);

	new EndPoints.postEndpoint(
		"/post/tournament",
		"INSERT INTO tournaments (ranking_1, ranking_2, ranking_3, ranking_4, status) VALUES (?, ?, ?, ?, ?)",
		"Tournament data insertion error"
	);

	new EndPoints.postEndpoint(
		"/post/profile",
		"INSERT INTO profiles (user_id, pseudo) VALUES (?, ?)",
		"Data insertion error"
	);

	new EndPoints.postEndpoint(
		"/post/user",
		"INSERT INTO users (name, pass, login_method) VALUES (?, ?, ?)",
		"Data insertion error"
	);

	new EndPoints.postEndpoint(
		"/post/friendship",
		`INSERT INTO friends (user_id, friend_id, sender_id) VALUES (?, ?, ?)`,
		"Failed to create friendship"
	);

	new EndPoints.patchEndpoint(
		"/patch/status",
		"UPDATE profiles SET status = ? WHERE user_id = ?",
		"Status update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/match",
		"UPDATE matches SET player0_score = ?, player1_score = ?, winner_id = ?, disconnected = ? WHERE id = ?",
		"Match data patching error"
	);

	new EndPoints.patchEndpoint(
		"/patch/tournament",
		"UPDATE tournaments SET ranking_1 = ?, ranking_2 = ?, ranking_3 = ?, ranking_4 = ?, status = ? WHERE id = ?",
		"Tournament data patching error"
	);

	new EndPoints.patchEndpoint(
		"/patch/user",
		"UPDATE users SET name = ? WHERE id = ?",
		"Data update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/bio",
		`UPDATE profiles SET bio = ? WHERE user_id = ?`,
		"Data update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/friendship",
		`UPDATE friends SET status = 'accepted' WHERE id = ?`,
		"Friendship update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/friendship_block",
		`UPDATE friends SET status = 'blocked' WHERE id = ?`,
		"Friendship update error"
	);
	
	new EndPoints.patchEndpoint(
		"/patch/pseudo",
		`UPDATE profiles SET pseudo = ? WHERE user_id = ?`,
		"Data update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/avatar",
		`UPDATE profiles SET avatar = ? WHERE user_id = ?`,
		"Data update error"
	);

	new EndPoints.patchEndpoint(
		"/patch/2fa",
		`UPDATE users SET two_fa = ?,two_fa_secret = ? WHERE id = ?`,
		"Failed to set 2FA secret"
	);

	new EndPoints.deleteEndpoint(
		"/delete/2fasecret",
		`UPDATE users SET two_fa_secret = NULL WHERE id = ?`,
		"Failed to delete 2FA secret"
	);
	
	new EndPoints.deleteEndpoint(
		"/delete/avatar",
		`UPDATE profiles SET avatar = 'public/avatars/default_avatar.jpg' WHERE user_id = ?`,
		"Data removal error"
	)

	new EndPoints.deleteEndpoint(
		"/delete/user",
		"DELETE FROM users WHERE id = ?",
		"Data removal error"
	);

	new EndPoints.deleteEndpoint(
		"/delete/profile",
		"DELETE FROM profiles WHERE id = ?",
		"Data removal error"
	);

	new EndPoints.deleteEndpoint(
		"/delete/friendships",
		"DELETE FROM friends WHERE user_id = ? or friend_id = ?",
		"Data removal error"
	);

	new EndPoints.deleteEndpoint(
		"/delete/friendship",
		"DELETE FROM friends WHERE id = ?",
		"Data removal error"
	);

	EndPoints.Endpoint.enableAll(server, db);
}

async function start() {

	connect();
	setTables();
	setEndPoints();

	console.log("Enpoints registered:\n" + server.printRoutes());
	
	try {
		server.register(FormBodyPlugin);
		await server.listen({ port: 3000, host: '0.0.0.0' });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}

start();
