import App from './App.svelte';

// V0.1: first version
// V0.2: settings is ok, get sunrise and sunset is ok
// V0.3: line up the name of the setting-variables in the frontend with the database-names
// V0.4: statemachine ok, created timers to open/close door at sunrise/sunset
// V0.5: bugfix door open/close delay
// V0.6: all implemented, assemble hardware

const app = new App({
	target: document.body,
	props: {
		version: 'V0.6'
	}
});

export default app;