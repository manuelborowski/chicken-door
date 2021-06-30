<script>
	import Header from './components/Header.svelte'
	import Footer from './components/Footer.svelte'
	
	import Main from './components/Main.svelte'
	import SettingsForm from './components/SettingsForm.svelte'
	import Tabs from './shared/Tabs.svelte'

	const ti_main = 'Overzicht';
	const ti_settings = 'Instellingen';

	//tabs
	let items = [ti_main, ti_settings];
	let active_item = ti_main;


	const tab_change = e => active_item = e.detail;

	</script>

<svelte:head>
	<title>Kippendeur</title>
</svelte:head>

<Header />
<main>
	<Tabs {active_item} {items} on:tab_change={tab_change}/>
	{#if active_item === ti_main}
	<Main/>
	{:else}
	<SettingsForm/>
	{/if}
</main>
<Footer />
<style>
main {
	max-width: 960px;
	margin: 40px auto;
}
</style>