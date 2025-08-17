# Servicio: Database

*   Autor: Fran Montserrat
*   Contacto: @fmontser en *Slack*

Este directorio contiene el código fuente y la configuración para el servicio **Database** del proyecto Trascendence.

`src/database.ts`: Archivo main, tambien su usa para definir comportamientos.

`src/endpoint.ts`: Libreria de clases para crear endpoints.

## Documentación del Servicio

*   **Propósito del Servicio:** El servicio pone a disposicion del backend/frontend una base de datos **SQLite** mediante el uso de endpoints. Cada servicio puede configurar tablas y endpoints necesarios de forma facil.

---

*   **API (Tablas):**
	*   Cuando un servicio necesita hacer uso de la BBDD, puede crear tablas propias. Mediante el uso de la funcion **setTables()** en **database.ts**.

	Debe añadir la tabla en forma de **string** al array **tables**, separandolos por **comas**.

	```typescript
	function setTables(): void {

		let tables: string[] = [`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT UNIQUE NOT NULL,
				pass TEXT NOT NULL
			)`

			//Add tables here, comma separated.
		];

		tables.forEach(table => {
			db.run(table, (cb) => {
			if (cb)
				console.error("SQLite error: Table creation error - ", cb.message);
			});
		}); 
	}
	```

---

*   **API (Endpoints):**
	*   Cuando un servicio necesita hacer uso de la BBDD, puede crear **endpoints** meidante el uso de la funcion **setEndpoints()** en el archivo **database.ts**.

	*   Pueden crearse endpoints de tipo **GET, POST, PUT, PATCH  y DELETE**.
	*   Las funciones correspondientes son **getEnpoint()** , **postEndpoint**(), **putEndpoint()**, etc...
	*   Todas las funciones **endpoint** necesitan los argumentos:
	*   **path:** Ruta del endpoint. ej: `/database/front/get/users`
	*   **sql:** Predicado SQL.
	*   **errorMsg:** Mensaje de error en caso de fallo. Este mensaje se pasara por la **consola del container** y tambien en la respuesta del endpoint junto a un estado `500 Internal server error` en todos los casos.
	*   **Respuesta POST:** Al usar un enpoint tipo POST, recibiremos el ID de la nueva fila en la respuesta.

	```typescript
	function setEndPoints(): void {
		//Add endpoints here

		//GET Sample
		new EndPoints.getEndpoint(
			"/database/front/get/users",
			"SELECT * FROM users",
			"Failed to get users"
		);

		//POST Sample
		new EndPoints.postEndpoint(
			"/database/front/post/user",
			"INSERT INTO users (name, pass) VALUES (?, ?)",
			"Data insertion error"
		);

		//PUT SAMPLE
		new EndPoints.putEndpoint(
			"/database/front/put/user",
			"UPDATE users SET name = ?, pass = ? WHERE id = ?",
			"Data update error"
		);

		//PATCH SAMPLE
		new EndPoints.patchEndpoint(
			"/database/front/patch/user",
			"UPDATE users SET name = ? WHERE id = ?",
			"Data update error"
		);

		//DELETE SAMPLE
		new EndPoints.deleteEndpoint(
			"/database/front/delete/user",
			"DELETE FROM users WHERE id = ?",
			"Data removal error"
		);

		EndPoints.Endpoint.enableAll(server, db);
	}
	```

---

*   **Dependencias:** Este servicio no tiene dependencia de otros servicios.
*   **Variables de Entorno:**
	*   Nombre del container: **dataBase**
	*   Archivo **.env**:
		*   **HOST_DB_VOL_PATH**: Ruta al volumen persistente donde se almacena el archivo **backendDatabase.db**.
		*   **DB_BUILD_PATH**: Ruta hasta la carpeta del servicio.
	
*   **Notas Adicionales:**
	*   Ninguna

`¡Mantén esta documentación actualizada a medida que el servicio evoluciona!` Una buena documentación es clave para el éxito del proyecto y la colaboración en equipo.
