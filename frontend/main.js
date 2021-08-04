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

const app = new App({
	target: document.body,
	props: {
		version: 'V0.8'
	}
});

export default app;