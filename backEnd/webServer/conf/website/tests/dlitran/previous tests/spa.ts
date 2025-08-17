/*
==================================================================
This script contains the entire logic for our Single-Page App.
==================================================================
*/

/**
 * FIX #1: Define an interface for our routes object.
 * This tells TypeScript that `routes` can be indexed by any string key,
 * which solves the error when using `window.location.pathname`.
 */
interface RouteMap {
	[key: string]: string;
}

/** 
 * PART 1: THE CONTENT (Our "Pages")
 * ------------------------------------
 * We apply the RouteMap interface here.
 */
const routes: RouteMap = {
	"/": "<h1>Home Page</h1><p>Welcome! This is the home page.</p>",
	"/page1": "<h1>Page One</h1><p>You are on the first page.</p>",
	"/page2": "<h1>Page Two</h1><p>This is the second page, loaded without a refresh.</p>",
};

/**
 * PART 2: THE ROUTER (The "Engine")
 * ------------------------------------
 */
const router = () => {
	console.log("Router is running for path:", window.location.pathname);

	const content = routes[window.location.pathname] || "<h1>404 - Page Not Found</h1>";

	/**
	 * FIX #2: Add a null check for `getElementById`.
	 * `getElementById` can return `null` if the element isn't found.
	 * This check ensures we only try to modify the element if it exists.
	 */
	const appDiv = document.getElementById("app");
	if (appDiv) {
		appDiv.innerHTML = content;
	} else {
		console.error("Error: Could not find the #app div in the document.");
	}
};

/**
 * PART 3: THE EVENT LISTENERS (The "Triggers")
 * ------------------------------------
 */

// A) Run the router when the user clicks on a link.
// We also type the event `e` as a `MouseEvent` for better type safety.
window.addEventListener("click", (e: MouseEvent) => {
	/**
	 * FIX #3: Use `instanceof` to check the element type.
	 * This is the modern, safe way to check an event target.
	 * It simultaneously confirms that `e.target` is not null AND that it's
	 * specifically an <a> tag, giving us access to properties like `.href`.
	 * This one check solves all the errors related to `e.target`.
	 */
	if (e.target instanceof HTMLAnchorElement) {
		e.preventDefault(); // STOP the browser from doing a full page reload.
		history.pushState(null, "", e.target.href); // UPDATE the URL in the address bar.
		router(); // RUN our router to show the new page content.
	}
});

// B) Run the router when the user uses the browser's back/forward buttons.
window.addEventListener("popstate", router);

// C) Run the router once on the initial page load.
window.addEventListener("DOMContentLoaded", router);