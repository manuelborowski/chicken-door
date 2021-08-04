<script>
  import {onMount, onDestroy} from "svelte";
  import socket from "../scripts/socketio";
  import {get_settings} from "../scripts/data";

  const doorState = {
    OPEN: "open",
    OPENING: "opening",
    CLOSED: "closed",
    CLOSING: "closing",
    ERROR: "error",
    STOPPED_OPENING: "stopped_opening",
    STOPPED_CLOSING: "stopped_closing",
  }
  const frontEndEvent = {
    BTN_OPEN: "btn_open",
    BTN_CLOSE: "btn_close",
    BTN_DOOR: "btn_door",
    GET_STATE: "get_state",
  };

  let door_state;
  let settings;

  const door_state_event = event => {
    door_state = event;
    console.log("MAIN SVELTE: door state", door_state);
  }

  const front_end_event = event => {
    socket.emit("door", event)
  }

  const toggle_door = () => {
    switch (door_state) {
      case doorState.OPEN:
      case doorState.CLOSING:
        socket.emit("door", frontEndEvent.BTN_CLOSE)
        break;
      case doorState.CLOSED:
      case doorState.OPENING:
        socket.emit("door", frontEndEvent.BTN_OPEN)
        break;
    }
  }

  onMount(() => {
    socket.on("door", door_state_event);
    socket.emit("door", frontEndEvent.GET_STATE)
    get_settings().then(s => settings = s);
  });

  onDestroy(() => {
    socket.off("door", door_state_event);
  });
</script>

<div class="container">
    <div on:click={() => socket.emit("door", frontEndEvent.BTN_DOOR)}>
        {#if door_state === doorState.OPENING }
            <div class="door-anim opening-door-anim"
                 style="animation-duration: {settings.anim_door_duration}s"></div>
        {:else if door_state === doorState.CLOSING }
            <div class="door-anim closing-door-anim"
                 style="animation-duration: {settings.anim_door_duration}s"></div>
        {:else if door_state === doorState.OPEN }
            <img src="img/sliding-door-open.png" alt=""/>
        {:else if door_state === doorState.CLOSED }
            <img src="img/sliding-door-closed.png" alt=""/>
        {:else if door_state === doorState.STOPPED_OPENING }
            <img src="img/sliding-door-halfway.png" alt=""/>
            <div class="overlayed-text">Gestopt</div>
        {:else if door_state === doorState.STOPPED_CLOSING }
            <img src="img/sliding-door-halfway.png" alt=""/>
            <div class="overlayed-text">Gestopt</div>
        {:else if door_state === doorState.ERROR }
            <img src="img/sliding-door-halfway.png" alt=""/>
            <div class="overlayed-text">FOUT</div>
        {/if}
    </div>
</div>

<style>
    .closing-door-anim {
        background-image: url('../img/sliding-door-closing-sprite.png');
    }
    .opening-door-anim {
        background-image: url('../img/sliding-door-opening-sprite.png');
    }
    .door-anim {
        width: 400px;
        height: 291px;
        animation: door-anim-keyframes 10.0s steps(30) infinite;
    }
    @keyframes door-anim-keyframes {
        100% {
            background-position: -12000px;
        }
    }
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
        height: 291px;
    }
    .container {
        position: relative;
        text-align: center;
    }
    .overlayed-text {
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 80px;
        color: red;
        font-weight: bold;
    }
</style>
