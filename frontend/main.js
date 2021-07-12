import App from './App.svelte';

// V0.1: first version
// V0.2: settings is ok, get sunrise and sunset is ok

const app = new App({
	target: document.body,
	props: {
		version: 'V0.2'
	}
});

export default app;