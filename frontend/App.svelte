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
	let hide_ti_main = 'hidden';
	let hide_ti_settings = 'hidden';


	const tab_change = e => {
		active_item = e.detail
		hide_ti_main = active_item !== ti_main ? 'hidden' : 'test';
		hide_ti_settings = active_item !== ti_settings ? 'hidden' : 'test';
	};
	</script>

<svelte:head>
	<title>Kippendeur</title>
</svelte:head>

<Header />
<main>

	<Tabs {active_item} {items} on:tab_change={tab_change}/>

	<!-- <div hidden={active_item !== ti_main}>
	<Main/>
</div>
<div hidden={active_item !== ti_settings}>
	<SettingsForm/>
</div> -->

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