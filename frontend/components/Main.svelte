<script>
  import { onMount, onDestroy } from "svelte";
  import Button from '../shared/Button.svelte';
  import socket from "../scripts/socketio";

  const doorState = {
    OPEN: "open",
    CLOSED: "closed",
  };

  let door_state = doorState.CLOSED;

  function door_state_event(d) {
    door_state = d.door === "open" ? doorState.OPEN : doorState.CLOSED;
    console.log("door state", d, door_state);
  }

  onMount(() => {
    socket.on("door", door_state_event);
  });

  onDestroy(() => {
    socket.off("door", door_state_event);
  });
</script>

<div>
  <img src={door_state === doorState.OPEN ? "img/door open.png" : "img/door closed.png"} alt="" />
  <div>
  <Button type='secondary' on:click="{() => socket.emit('door', {door: doorState.CLOSED})}">Deur sluiten</Button>
  <Button on:click="{() => socket.emit('door', {door: doorState.OPEN})}">Deur openen</Button>
</div>
</div>

<style>
  div {
    margin: auto;
  }
  div div {
    width: fit-content;
    margin-top: 10px;
  }

  div img {
    display: block;
    margin-left: auto;
    margin-right: auto;
    height: 200px;
  }
</style>
