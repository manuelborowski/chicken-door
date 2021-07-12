import App from './App.svelte';

// V0.1: first version
// V0.2: settings is ok, get sunrise and sunset is ok
// V0.3: line up the name of the setting-variables in the frontend with the database-names

const app = new App({
	target: document.body,
	props: {
		version: 'V0.3'
	}
});

export default app;