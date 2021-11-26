import App from './App.svelte';

// V0.1: first version
// V0.2: settings is ok, get sunrise and sunset is ok
// V0.3: line up the name of the setting-variables in the frontend with the database-names
// V0.4: statemachine ok, created timers to open/close door at sunrise/sunset
// V0.5: bugfix door open/close delay
// V0.6: all implemented, assemble hardware
// V0.7: bugfix: timestrings (use locale), clear timer when new timer is created, incremented debouncetime.
// V0.8: bugfixed issue with pm2 and __dirname
// Added info endpoint to get processor-temperature
// Added sunrise- and sunsetoffset
// V0.9: settings: added door-animation-duration to tweak the animated door with the real door.
// statemachine update: by clicking on the animated door, it is possible to close, open or stop the door
// animated door in website
// V0.10: added .gitignore
// V0.11: bugfix DoorGpio: state "stop" is replaced with "stop_opening" and "stop_closing"
// V0.12: use API key to access site.  Added secret.js to hold api-key.  It is NOT in git.
// V0.13: changed some console.log to logger.info
// V0.14: bugfix: added STOP event handler

const app = new App({
	target: document.body,
	props: {
		version: 'V0.14'
	}
});

export default app;