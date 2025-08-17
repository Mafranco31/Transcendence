export abstract class Endpoint {

	protected static list: Set<Endpoint> = new Set();
	protected path: string;
	protected sql: string;
	protected errorMsg: string;

	constructor(path: string, sql: string, errorMsg: string) {
		this.path = path;
		this.sql = sql;
		this.errorMsg = errorMsg;
		Endpoint.list.add(this);
	}
	
	protected abstract add(server: any, db: any): void;

	public static enableAll(server: any, db: any): void {
		for (const endpoint of Endpoint.list)
			endpoint.add(server, db);
	}

	protected async pull(server: any, db: any, request:any, reply: any) {
		try {
			const values = Object.values(request.query);
			const rows = await new Promise<any[]>((resolve, reject) => {
				db.all(this.sql, values, (err: any, rows: any) => {
					if (err) {
						console.error(`SQLite error: ${this.errorMsg} - `, err.message);
						reject(err);
					} else
						resolve(rows);
				});
			});
			console.log(`DataBase: ${this.path} - `, rows);
			reply.send(rows);
		} catch (error) {
			server.log.error(`DataBase: ${this.errorMsg} - `, error);
			reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
		}
	}

	protected async push(server: any, db: any, request: any, reply: any) {
		const ctx = this;
		try {
			if (!request.body || typeof request.body !== 'object')
				throw new Error("Endpoint request is malformed!");
			
			const lastID = await new Promise<number>((resolve, reject) => {
				db.run(ctx.sql, Object.values(request.body), function(this: { lastID: number},err: any) {
					if (err) {
						reject(err);
					} else {
						resolve(this.lastID);
					}
				});
			});

		return reply.send({ id: lastID });

		} catch (error) {
			server.log.error(`DataBase: ${this.errorMsg} - :`, error);
			return reply.status(500).send({ error: `Internal server error: ${this.errorMsg}` });
		}
	}
}

export class getEndpoint extends Endpoint {
	add(server: any, db: any): void {
		server.get(this.path, async (request: any, reply: any) => {
			return await this.pull(server, db, request, reply);
		});
	}
}

export class postEndpoint extends Endpoint {
	add(server: any, db: any): void {
		server.post(this.path, async (request: any, reply: any) => {
			await this.push(server, db, request, reply);
		});
	}
}

export class putEndpoint extends Endpoint {
	add(server: any, db: any): void {
		server.put(this.path, async (request: any, reply: any) => {
			await this.push(server, db, request, reply);
		});
	}
}

export class patchEndpoint extends Endpoint {
	add(server: any, db: any): void {
		server.patch(this.path, async (request: any, reply: any) => {
			await this.push(server, db, request, reply);
		});
	}
}

export class deleteEndpoint extends Endpoint {
	add(server: any, db: any): void {
		server.delete(this.path, async (request: any, reply: any) => {
			await this.push(server, db, request, reply);
		});
	}
}
