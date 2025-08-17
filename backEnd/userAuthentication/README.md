# Servicio: Userauthentication

*   Autor: nombre
*   Contacto: @user en *Slack*

Este directorio contiene el código fuente y la configuración para el servicio **Userauthentication** del proyecto Trascendence.

`src/userauthentication.ts`: Archivo main.

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
*   
    **EndPoints para tener el user ID**     
        PATH: "/userauthentication/front/get/profile_session_with_token"        
        METHOD: GET   
        ARG:    necesitar estar conectado      
        RETURN: 'id'        

*    **EndPoints para crear un perfil**     
        PATH: "/userauthentication/front/post/create"       
        METHOD: POST        
        ARG:    'name' and 'pass' in body       
        RETURN: sucess    

*   **EndPoint para conectarse con google**       
        PATH: "/userauthentication/front/post/google_connect"       
        METHOD: POST        
        ARG:    credential from google      
        RETURN: sucess     

*   **EndPoint para conectarse**       
        PATH: "/userauthentication/front/post/login"        
        METHOD:  POST        
        ARG:    'name' and 'pass' in body             
        RETURN: sucess if no 2FA, otherwise 'token' el token para connectar con 2FA y 'twofaRequired=true'

*   **EndPoint para disconectarse**     
        PATH: "/userauthentication/front/post/logout"       
        METHOD: POST        
        ARG:    Nothing     
        RETURN: sucess     

*    **EndPoints para crear el 2FA**        
        1: el para iniciar el setup :       
        PATH:   "/userauthentication/front/post/2fa/setup"      
        METHOD: POST     
        ARG:    necesita estar conectado      
        RETURN:     'qrCode' to display on the html page to make the user scan it, 'manualKey' to allow user to enter manualy the key if he cant scan the qrCode        

        2:   el para enable el 2FA despues del scan     
        PATH:   "/userauthentication/front/post/2fa/enable"     
        METHOD:     POST        
        ARG:     'userID' del user, 'google_token' code que da google en el mobil cuando haces el scan del qrCode       
        RETURN:    sucess      

*   **EndPoint para conectarse con 2FA**        
        PATH:   "/userauthentication/front/post/2fa/login"      
        METHOD: POST        
        ARG:      'tempToken'  el token que return el normal login cuando 2FA esta activada y 'google_token' el codigo de 6 numeros que da google desde el mobil cuando conectaste      
        RETURN: sucess     

*   **EndPoint para suprimar el 2FA**       
        PATH:   "/userauthentication/front/patch/2fa/delete"        
        METHOD: PATCH       
        ARG:     necesita estar conectado      
        RETURN: sucess
---

*   **Dependencias:** Descripcion de dependencias inter-servicios.
*   **Variables de Entorno:**
    *   Nombre del container: **userauthentication**
    *   Archivo **.env**:
        *   **SAMPLE_ENV_VAR**: Descricion de variables **.env**
    
*   **Notas Adicionales:**
    *   Notas

`¡Mantén esta documentación actualizada a medida que el servicio evoluciona!` Una buena documentación es clave para el éxito del proyecto y la colaboración en equipo.

