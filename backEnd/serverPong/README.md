# Servicio: Serverpong

*   Autor: Fran Montserrat
*   Contacto: @fmontser en *Slack*

Este directorio contiene el código fuente y la configuración para el servicio **Serverpong** del proyecto Trascendence.

`src/serverpong.ts`: Archivo main, configura el servicio.

`src/endpoint.ts`: Configura endpoints con websocket e implementa las comunicaciones.

`src/pongEngine.ts`: Define el objeto juego que orquestra el gameplay genera la informacion para ser enviada a cliente y otros servicios.

`src/gameObject.ts`: Definicion de clase abstracta para gameObjects.

`src/playField.ts`: Define e implementa el comportamiento de la zona de juego.

`src/ball.ts`: Define e implementa el comportamiento de la bola.

`src/paddle.ts`: Define e implementa el comportamiento de las palas.



## Documentación del Servicio

*   **Propósito del Servicio:**
	
	Este servicio implementa la logica de juego pong, controla la posicion, el movimiento y el comportamiento de todos los elementos del jeugo. Recibe el input del cliente, lo procesa y devuelve el estado cada 16ms (60 fps). Al finalizar envia el resultado del juego. Tambien habla con el matchmaker para coordianr el registro de las partidas e informar a los clientes.

---
*   **BACKEND-API:**

	El servicio se comunica por websocket con el matchMaker, para ello el matchmaker es el responsable de establecer la comunicacion hacia el endpoint:

	```typescript
	function connect(): void { 
		ws = new WebSocket(`ws://serverPong:3000/post/match`);
		//...
	}
	```
	El endpoind estara esperando un mensaje JSON para crear el juego con el UID del match registrado previamente en la BBDD:

	```json
	{
		"type": "postMatchRequest",
		"gameUID": matchUID
	}
	```

	El endpoint devolvera la respuesta confirmando la creacion mientras espera a los jugadores, que seran informados por el matchMaker.

	```json
	{
		"type": "postMatchResponse"
	}
	```

*   **FRONTEND-API:**
	*   El servicio se comunica por websocket con el cliente.

	*   El cliente debe establecer comunicacion con el endpoint mediante secure websocket wss, para luego recibir y enviar mensajes mediante el sistema de eventos (ver endpoint).

	*   Existen dos modos de juego, juego local (no registrado) y juego online (registrado).

	---
*   **JUEGO LOCAL:**	

	En este modo dos jugadores compiten en un solo ordenador, en un solo teclado, el servicio serverPong sigue administrando la partida, pero esta no se registra en el sistema ni necesita de jugadores registrados.

	El cliente debe conectar al endpoint:

	```typescript
	//Juego local no registrado
	function connect(): void { 
		ws = new WebSocket(`wss://${window.location.hostname}:8443/serverpong/front/get/pong`);
		//...
	}
	```
	A continuacion y para  **JUEGO LOCAL** la comunicación entre cliente y servidor sigue esta secuencia:

1. **Cliente solicita configuración inicial:**
	```json
	{
		"type": "setupRequest"
	}
	```

2. **Servidor envía la configuración:**
	```json
	{
		"type": "configuration",
		"ballPos": {
			"x": "number",
			"y": "number"
		},
		"ballRadius": "number",
		"paddlesPos": [
			{ "x": "number", "y": "number" },
			{ "x": "number", "y": "number" }
		],
		"paddleHeight": "number",
		"paddleWidth": "number",
		"score": [0, 0]
	}
	```

3. **Cliente configura y solicita nueva partida:**
	```json
	{
		"type": "newGame",
	}
	```
---
	En este punto de igual forma que el juego local empieza la comunicacion bidireccional en tiempo real, el cliente envia el input y el servidor actualiza la disposicion del juego 60 veces por segundo. Esto lo hace para cada jugador en modo broadcast.
---
4. **Comunicación durante el juego:**

- Cliente envía movimientos de paleta:
	```json
	{
		"type": "input",
		"playerSlot": "number",
		"direction": "up | down | stop"
	}
	```

- Servidor envía actualizaciones (60fps):
	```json
	{
		"type": "update",
		"ball": {
			"x": "number",
			"y": "number"
		},
		"paddles": [
			{ "x": "number", "y": "number" },
			{ "x": "number", "y": "number" }
		],
		"score": ["number", "number"]
	}
	```
---
	Al cumplirse las condiciones de victoria, el servidor envia un mensaje con el resultado final. El cliente puede mostrar el resultado en pantalla y es libre de solicitar otro juego.
---
5. **Servidor envía resultado final:**
	```json
	{
		"type": "endGame",
		"gameUID": "number",
		"giveUp": "boolean",
		"player1Id": "number",
		"player2UID": "number",
		"winnerId": "number",
		"score": ["number", "number"]
	}
	```
---
	Fin del juego local
---

*   **JUEGO ONLINE:**	

	Previamente a la conexion con el servidor de juego, el cliente debe solicitar unirse a una partida al matchmaker, que le asignara el primer lugar disponible proporcionara al cliente la informacion necesaria para anunciar el juego y conectarser al servidorPong.

	Para conectarse a una partida online registrada, debe usar el endpoint:

	```typescript
	//Juego online registrado
	function connect(): void { 
		ws = new WebSocket(`wss://${window.location.hostname}:8443/serverpong/front/get/game`);
		//...
	}
	```

	A continuacion y para  **JUEGO ONLINE** la comunicación entre cliente y servidor sigue esta secuencia:

1. **Cliente solicita configuración inicial:**
	```json
	{
		"type": "setupRequest",
		"userId:" userId,
		"userSlor:" userSlot,
		"gameUID:" gameUID
	}
	```

2. **Servidor envía la configuración:**
	```json
	{
		"type": "setupResponse",
		"ballPos": {
			"x": "number",
			"y": "number"
		},
		"ballRadius": "number",
		"paddlesPos": [
			{ "x": "number", "y": "number" },
			{ "x": "number", "y": "number" }
		],
		"paddleHeight": "number",
		"paddleWidth": "number",
		"score": [0, 0]
	}
	```

3. **Cliente configura y comunica que esta listo para empezar:**
	```json
	{
		"type": "startRequest",
		"userId": userId
	}
	```
---
	En este punto de igual forma que el juego local empieza la comunicacion bidireccional en tiempo real, el cliente envia el input y el servidor actualiza la disposicion del juego 60 veces por segundo. Esto lo hace para cada jugador en modo broadcast.
---

4. **Comunicación durante el juego:**

- Cliente envía movimientos de paleta:
	```json
	{
		"type": "input",
		"playerSlot": "number",
		"direction": "up | down | stop"
	}
	```

- Servidor envía actualizaciones (60fps):
	```json
	{
		"type": "update",
		"ball": {
			"x": "number",
			"y": "number"
		},
		"paddles": [
			{ "x": "number", "y": "number" },
			{ "x": "number", "y": "number" }
		],
		"score": ["number", "number"]
	}
	```
---
	Al terminar la partida el servidor envia el resultado a ambos jugadores. Y al matchMaker para que registre el encuentro. Si alguno de los jugadores se desconecto durante el juego, el jugador que permanece gana la partida y asi queda registrado.
---
5. **Servidor envía resultado final a los jugadores y al matchMaker:**
	```json
	{
		"type": "endGame | playerDisconnected",
		"gameUID": "number",
		"winnerId": "number",
		"score": ["number", "number"]
	}
	```
---

*   **Dependencias:** Este servicio necesita al servicio de matchmaking para el multijugador online .
*   **Variables de Entorno:**
	*   Nombre del container: **serverpong**
	*   Archivo **.env**:
		*   **SPONG_BUILD_PATH**: Ruta hasta la carpeta del servicio.
	
*   **Notas Adicionales:**
	*   Ninguna

`¡Mantén esta documentación actualizada a medida que el servicio evoluciona!` Una buena documentación es clave para el éxito del proyecto y la colaboración en equipo.



