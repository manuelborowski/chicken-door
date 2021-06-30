<script>
  import { onMount } from "svelte";
  import { io } from "socket.io-client";
  const socket = io();

  const doorState = {
    OPEN: 'open',
    CLOSED: 'closed'
  };

  let door_state = doorState.CLOSED;

onMount(async () => {
    socket.on('connect', () => {
      console.log('Main connected');
      socket.on('main', d => {
        door_state = d.door === 'open' ? doorState.OPEN : doorState.CLOSED;
        console.log('door state', door_state);
      });
    });
  });
  
</script>

<h2>Overzicht</h2>

<style>
  h3 {
    margin: 0 auto;
    color: #555;
  }
  p {
    margin-top: 6px;
    font-size: 14px;
    color: #aaa;
    margin-bottom: 30px;
  }
  .answer {
    background: #fafafa;
    cursor: pointer;
    margin: 10px auto;
    position: relative;
  }
  .answer:hover {
    opacity: 0.6;
  }
  span {
    display: inline-block;
    padding: 10px 20px;
  }
  .percent {
    height: 100%;
    position: absolute;
    box-sizing: border-box;
  }
  .percent-a {
    border-left: 4px solid #d91b42;
    background: rgba(217, 27, 66, 0.2);
  }
  .percent-b {
    border-left: 4px solid #45c496;
    background: rgba(69, 196, 150, 0.2);
  }
  .delete {
    margin-top: 30px;
    text-align: center;
  }
</style>
