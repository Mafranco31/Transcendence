# Servicio: Usermanagement

*   Autor: nombre
*   Contacto: @user en *Slack*

Este directorio contiene el código fuente y la configuración para el servicio **Usermanagement** del proyecto Trascendence.

`src/usermanagement.ts`: Archivo main.

`src/other.ts`: Otros archivos.

## Documentación del Servicio

*   **Propósito del Servicio:** Descripcion...

---

*   **API:**
    *   Explicacion de uso del servicio. Ejemplos de codigo de ser necesario.

    ```typescript
    function sampleFunction(): void { 

        let text: string = "text";
        let number: number = 1;
    }
    ```
---
*   **API (Endpoints):**
    *   Para cada endpoint expuesto para el servicio intentar dar la informacion mas completa posible:
        *   Método HTTP (GET, POST, PUT, DELETE, etc.).
        *   Ruta (path).
        *   Descripción de lo que hace el endpoint.
        *   Parámetros de ruta (si los hay).
        *   Parámetros de consulta (query parameters, si los hay).
        *   Cuerpo de la petición esperado (request body), incluyendo formato y campos obligatorios/opcionales.
        *   Ejemplos de peticiones.
        *   Respuestas posibles (códigos de estado HTTP y cuerpo de la respuesta esperado para cada caso, incluyendo errores).
        *   Ejemplos de respuestas.
        
        **EndPoints para tener las tables** (tests)  
        * PATH:   "/usermanagement/front/get/users"  
        METHOD: GET   
        ARG:    sin argumentos  
        RETURN: table 'users'  

        * PATH:   "/usermanagement/front/get/profiles"  
        METHOD: GET  
        ARG:    sin argumentos  
        RETURN: table 'profiles'

        * PATH:   "/usermanagement/front/get/friends"  
        METHOD: GET  
        ARG:    sin argumentos  
        RETURN: table 'friends'

        **EndPoint para mirar el perfile de un usuario**  
        * PATH:   "/usermanagement/front/get/profile"  
        METHOD: GET  
        ARG:    'id' in query string  
        RETURN: linea de la table "profiles" del user_id 'id'

        **EndPoint para mirar los nametags (para tener amigos pro   ejemplo)**
        * PATH:   "/usermanagement/front/get/pseudos"  
        METHOD: GET  
        ARG:    sin argumentos pero necesita estar connectado  
        RETURN: Array de nametags

        **EndPoint para crear un user**  
        * PATH:   "/usermanagement/front/post/create"  
        METHOD: POST  
        ARG:    'name' and 'pass' in body  
        RETURN: Nada

        **EndPoint para log in**  
        * PATH:   "/usermanagement/front/post/login"  
        METHOD: POST  
        ARG:    'name' and 'pass' in body  
        RETURN: Nada

        **EndPoint para connectar al perfile de uno**  
        * PATH:   "/usermanagement/front/get/profile_session"  
        METHOD: GET  
        ARG:    'user'  
        RETURN: 'id' del user

        **EndPoints para modifiar information del usuario**  
        * PATH:   "/usermanagement/front/put/modify_bio"  
        METHOD: PATCH  
        ARG:    'bio' in body + necessita estar connectado  
        RETURN: Nada

        * PATH:   "/usermanagement/front/put/modify_pseudo"  
        METHOD: PATCH  
        ARG:    'pseudo' in body + necessita estar connectado  
        RETURN: Nada

        **EndPoint para borar el usuario**  
        * PATH:   "/usermanagement/front/delete/user"  
        METHOD: DELETE  
        ARG:    nada pero necessita estar connectado  
        RETURN: Nada

        **EndPoint para enviar una solicitud de amistad**  
        * PATH: "/usermanagement/front/post/friendship"  
        METHOD: POST  
        ARG:    'pseudo' del amigo + necessita estar connectado  
        RETURN: Nada  

        **EndPoint para acceptar la amistad**  
        * PATH: "/usermanagement/front/patch/accept_friendship"  
        METHOD: PATCH  
        ARG:    ID de la amistad  
        RETURN: Nada  

        **EndPoint para bloquear la amistad**  
        * PATH: "/usermanagement/front/patch/block_friendship"  
        METHOD: PATCH  
        ARG:    ID de la amistad  
        RETURN: Nada  

        **EndPoint para eliminar la amistad**  
        * PATH: "/usermanagement/front/delete/delete_friendship"  
        METHOD: PATCH  
        ARG:    ID de la amistad  
        RETURN: Nada  

        **EndPoint para ver las amistades esperando**  
        * PATH: "/usermanagement/front/get/friendships_pending"  
        METHOD: GET  
        ARG:    solo necessitar estar connectado  
        RETURN: id de la amistad + nickname del amigo

        **EndPoint para ver las amistades acceptada**  
        * PATH: "/usermanagement/front/get/friendships_accepted"  
        METHOD: GET  
        ARG:    solo necessitar estar connectado  
        RETURN: id de la amistad + nickname del amigo

        **EndPoint para ver las amistades bloqueada**  
        * PATH: "/usermanagement/front/get/friendships_blocked"  
        METHOD: GET  
        ARG:    solo necessitar estar connectado  
        RETURN: id de la amistad + nickname del amigo

---

*   **Dependencias:** Descripcion de dependencias inter-servicios.
*   **Variables de Entorno:**
    *   Nombre del container: **usermanagement**
    *   Archivo **.env**:
        *   **SAMPLE_ENV_VAR**: Descricion de variables **.env**
    
*   **Notas Adicionales:**
    *   Notas

`¡Mantén esta documentación actualizada a medida que el servicio evoluciona!` Una buena documentación es clave para el éxito del proyecto y la colaboración en equipo.

