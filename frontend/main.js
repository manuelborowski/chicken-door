import App from './App.svelte';

// V0.1: first version

const app = new App({
	target: document.body,
	props: {
		version: 'V0.1'
	}
});

export default app;