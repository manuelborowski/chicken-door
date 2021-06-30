<script>
  import {createEventDispatcher} from 'svelte';

  export let items;
  export let active_item;

  const dispatch = createEventDispatcher();
</script>

<div class="tabs">
<ul>
  {#each items as item}
  <li on:click={() => dispatch('tab_change', item)}>
    <div class:active={item===active_item}>{item}</div>
  </li>
  {/each}
</ul>
</div>

<style>
  .tabs {
    margin-bottom: 40px;;
  }
  ul {
    display: flex;
    justify-content: center;
    padding: 0;
    list-style-type: none;
  }
  li{
    margin: 0 16px;
    font-size: 18px;
    color: #555;
    cursor: pointer;
  }
.active  {
  color: #d91b42;
  border-bottom: 2px solid #d91b42;
  padding-bottom: 8px;
}
</style>