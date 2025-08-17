import { router } from './router.js';

console.log("login script loaded");

let tempTokenFor2FA: string | null = null;

const loginForm: HTMLFormElement = document.getElementById('login-form') as HTMLFormElement;
if (loginForm)
{
	loginForm.addEventListener('submit', async (event: SubmitEvent) => {
		const target = event.target as HTMLElement;
		const href = target.getAttribute('data-path')!;
		console.log("target", target, "ref", href)

		event.preventDefault();
		const formData = new FormData(loginForm);
		const formProps = Object.fromEntries(formData) as { name: string, pass: string };
		console.log("Username:", formProps.name);
		console.log("Passwowrd:", formProps.pass);
		try 
		{
			const response = await fetch("/userauthentication/front/post/login", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body:	JSON.stringify(formProps),
			});

			const data = await response.json();

			if (response.ok && data.twofaRequired){
				tempTokenFor2FA = data.token;
				(document.getElementById('login-form')!).classList.add('hidden');
				(document.getElementById('twoFASection')!).classList.remove('hidden');
			}
			else if (response.ok) 
			{
				console.log("response ok");
				if (target.matches('.spa-form')) {
					console.log(">>>>>>>>>>>>> nav-link found");
					history.pushState(null, '', href);
					router();
				}
			} 
		  	else 
			{
				const errorElem = document.getElementById('error') as HTMLParagraphElement | null;
				if (errorElem) {
					errorElem.textContent = data.error || "An error occurred during login. Please try again.";
				}
				console.error('Login failed:', response.status, data.error);
			}
		}
		catch (error)
		{
		  console.error('An error occurred during the login request:', error);
		}
	});
	}
else
{
	console.error('The form with ID "login-form" was not found.'); // Add for debugging
}

const verify2FABtn = document.getElementById('verify2FABtn');

if (verify2FABtn){
	verify2FABtn.addEventListener('click', async function () {
		const code = (document.getElementById('twoFACode')! as HTMLInputElement).value.trim();

		if (!code || code.length !== 6) {
			(document.getElementById('twoFAError')! as HTMLParagraphElement).textContent = "Enter a 6 digit code.";
			return;
		}

		const response = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/post/2fa/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				tempToken: tempTokenFor2FA,
				google_token: code
			})
		});

		const data = await response.json();

		if (response.ok && data.success) {
			console.log("response ok");
			history.pushState(null, '', '/');
			router();
		} else {
			(document.getElementById('twoFAError')! as HTMLParagraphElement).textContent = data.error || "Wrong code, please try again.";
		}
	});
}


declare namespace google {
	namespace accounts {
	  namespace id {
		function initialize(config: {
		  client_id: string;
		  callback: (response: CredentialResponse) => void;
		}): void;
  
		function renderButton(
		  parent: HTMLElement,
		  options: {
			theme?: string;
			size?: string;
			text?: string;
			shape?: string;
			logo_alignment?: string;
		  }
		): void;
  
		interface CredentialResponse {
		  credential: string;
		  select_by: string;
		}
	  }
	}
  }
  

function loadGoogleScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		const existingScript = document.getElementById('google-client');
		if (existingScript) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.id = 'google-client';
		script.async = true;
		script.defer = true;

		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Error loading Google scipt"));

		document.body.appendChild(script);
	});
}

function initializeGoogleSignIn() {
	google.accounts.id.initialize({
		client_id: "826866714242-u7rb76no703g0n8vauoq926n9cdkfgv3.apps.googleusercontent.com",
		callback: handleCredentialResponse
	});

	google.accounts.id.renderButton(
		document.getElementById("googleSignInDiv")!,
		{ theme: "outline", size: "large" }
	);
}
  
async function handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
	const response2 = await fetch(`https://${window.location.hostname}:8443/userauthentication/front/post/google_connect`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential: response.credential })
	});

	const data = await response2.json();

	if (response2.ok && data.twofaRequired){
		tempTokenFor2FA = data.token;
		(document.getElementById('login-form')!).classList.add('hidden');
  		(document.getElementById('twoFASection')!).classList.remove('hidden');
	}
	else if (response2.ok) {
		console.log("response ok");
		history.pushState(null, '', '/');
		router();
	} else {
		(document.getElementById('error')! as HTMLParagraphElement).textContent = data.error || "Error during Google Sign-In, please try again.";
	}
}

async function initialize() {
	try {
		console.log("loading Google Sign-In script...");
		await loadGoogleScript();

		console.log("Google Sign-In script loaded, initializing...");
		initializeGoogleSignIn();
	} catch (error) {
		console.error("Error initializing Google Sign-In :", error);
	}
}

initialize()
	  