<script>
  export let open = false;
	import { slide } from 'svelte/transition';
	const handleClick = () => open = !open
</script>

<div class="accordion">
	<div class="header" on:click={handleClick}>
		<div class="text">
			<slot name="head"></slot>	
		</div>
	</div>
	
	{#if open}
	<div class="details" transition:slide>
		<slot name="details">
		</slot>
	</div>
	{/if}
</div>

<style>
	div.accordion {
		margin: 1rem 0;
    background-color: royalblue;
	}
	
	div.header {
		display:flex;
		width:100%;
    color:whitesmoke;
    	}
	
	div.header .text {
		flex: 1;
		margin-right: 5px;
	}
	
.text{
  padding: 10px;
}

	div.details {
		background-color: #cecece;
		padding:1rem;
	}
  </style>
