# 42 Transcendence

Proyecto final del Common Core de 42 School, enfocado en el desarrollo de una plataforma web para el juego Pong con funcionalidades multijugador y características adicionales implementadas a través de módulos.

## Descripción del Proyecto

El objetivo de `ft_transcendence` es construir una aplicación web completa que permita a los usuarios registrarse, jugar partidas de Pong, participar en torneos y interactuar entre ellos. El proyecto se desarrolla utilizando Docker para la contenerización de servicios y se estructura en una parte obligatoria y módulos opcionales que extienden la funcionalidad.

## Flujo de Trabajo con Git

Este proyecto utiliza el modelo de ramificación **GitFlow**. Es imprescindible que todos los colaboradores sigan las directrices establecidas para la gestión de ramas y versiones.

**Consulte la guía de GitFlow del proyecto: [GitFlow CheatSheet](./.misc/gitFlow.md)**

## Stack Tecnológico

*   **Contenerización:** Docker
*   **Frontend:** TypeScript con el framework Tailwind CSS.
*   **Backend:** Microservicios desarrollados en TypeScript con Node.js y el framework Fastify.
*   **Base de Datos:** SQLite.

## Creación de Nuevos Servicios Backend

Antes de crear nada debemos tener instalado y actualizado el toolchain de Node.js.

```bash
make toolchain
```

Para la creación estandarizada de la estructura base de nuevos microservicios backend (Fastify/TypeScript), se utilizará el script `newService.py` ubicado en la carpeta `.misc`.

**Uso:**
```bash
make new backEnd/<nombre-del-nuevo-servicio>
```
Este script generará la estructura de directorios, archivos de configuración (`package.json`, `tsconfig.json`), un `Dockerfile` multi-etapa básico, un `Makefile` para pruebas y un `README.md` para el nuevo servicio.

**Componentes Clave de la Estructura:**

*   **`proxy/webProxy/`**: Este servicio Nginx actúa como el **único punto de entrada** a la aplicación desde el exterior. Recibe todas las peticiones HTTP/HTTPS.
    *   Redirige las peticiones destinadas a la interfaz de usuario (SPA) al servicio `backEnd/webServer/`.
    *   Redirige las peticiones de API (ej. `/api/*`) a los microservicios correspondientes ubicados en `backEnd/<nombre-servicio>/`.
    *   Es el responsable de la terminación SSL/TLS (HTTPS).
*   **`backEnd/webServer/`**: Un servicio Nginx dedicado a servir los archivos estáticos (HTML, CSS, JavaScript compilado) de la Single Page Application (frontend). Solo es accesible a través del `proxy`.
*   **`backEnd/<nombre-servicio>/`**: Cada subdirectorio aquí representa un microservicio backend independiente (desarrollado con Fastify/Node.js/TypeScript).
    *   Cada servicio tiene su propio `Dockerfile` y gestiona una responsabilidad específica (ej. usuarios, juego, chat).
    *   Estos servicios **no son accesibles directamente desde el exterior**; todas las interacciones con el cliente pasan a través del `proxy`.
    *   Los servicios backend pueden comunicarse entre sí directamente dentro de la red Docker si es necesario.
*   **`docker-compose.yml`**: Orquesta la construcción, configuración de red y ejecución de todos los contenedores (proxy, webServer, servicios backend, base de datos si la hubiera en un contenedor separado).
*   **`Makefile`**: Proporciona atajos para comandos comunes de Docker y gestión del proyecto.

Esta arquitectura asegura una separación de responsabilidades, donde el `proxy` maneja todo el tráfico entrante y lo distribuye adecuadamente, mientras que los servicios backend se enfocan en su lógica de negocio específica, y el `webServer` se dedica a entregar la SPA.

---

Consulte la documentación específica (`README.md`) dentro de cada directorio de servicio y la configuración en `docker-compose.yml` para más detalles.

## Estructura del Repositorio

```
.
├── backEnd/                  # Contiene los microservicios del backend y el servidor web de la SPA
│   ├── <nombre-servicio>/    # Directorio para cada microservicio backend
│   │   ├── Dockerfile        # Define cómo construir la imagen Docker del servicio
│   │   ├── src/              # Código fuente TypeScript del servicio
│   │   ├── README.md         # Documentacion del servicio a completar por creador
│   │   └── ...               # Otros archivos de configuración
│   └── webServer/            # Servicio Nginx para servir la SPA (Single Page Application)
│       ├── conf
│       │   ├── default.conf  # Archivo de configuración de Nginx para la SPA
│       │   └── website       # Directorio de desarrollo para el frontEnd TailWind CSS
│       └── Dockerfile        # Dockerfile para el Nginx de la SPA
├── docker-compose.yml        # Define y orquesta todos los servicios Docker
├── Makefile                  # Comandos útiles para la gestión del proyecto (build, up, down, etc.)
├── proxy/                    # Contiene la configuración del reverse proxy principal
│   └── webProxy/             # Servicio Nginx actuando como reverse proxy
│       ├── conf/             # Archivos de configuración de Nginx para el proxy
│       └── Dockerfile        # Dockerfile para el Nginx proxy
└── README.md                 # Este archivo
```
