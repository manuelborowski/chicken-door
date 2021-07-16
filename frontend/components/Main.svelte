<script>
  import { onMount, onDestroy } from "svelte";
  import Button from "../shared/Button.svelte";
  import socket from "../scripts/socketio";

  const doorEvent = {
    OPEN: "open",
    OPENING: "opening",
    CLOSED: "closed",
    CLOSING: "closing",
    ERROR: "error",
    GET_STATE: "get_state",
  };

  let door_state = doorEvent.CLOSED;
  let show_door_open;
  $: show_door_open = door_state === doorEvent.OPEN || door_state === doorEvent.CLOSING;

  function door_state_event(event) {
    door_state = event;
    console.log("MAIN SVELTE: door state", event, door_state);
  }

  onMount(() => {
    socket.on("door", door_state_event);
    socket.emit("door", doorEvent.GET_STATE)
  });

  onDestroy(() => {
    socket.off("door", door_state_event);
  });
</script>

<div>
  <img src={ show_door_open ? "img/door open.png" : "img/door closed.png"} alt="" />
  <div>
    <Button type="secondary" on:click={() => socket.emit("door", doorEvent.CLOSING )}>Deur sluiten</Button>
    <Button on:click={() => socket.emit("door", doorEvent.OPENING)}>Deur openen</Button>
  </div>
  {#if door_state === doorEvent.OPENING}
    <div class="message">
      <h1>Deur gaat open</h1>
    </div>
  {/if}
  {#if door_state === doorEvent.CLOSING}
    <div class="message">
      <h1>Deur sluit</h1>
    </div>
  {/if}
  {#if door_state === doorEvent.ERROR}
    <div class="message">
      <h1>Fout!</h1>
    </div>
  {/if}
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

  .message {
    border-style: groove;
    border-radius: 20px;
    padding: 20px;
  }
</style>
