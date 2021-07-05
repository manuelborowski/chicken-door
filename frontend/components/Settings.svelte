<script>
  import Button from "../shared/Button.svelte";
  import Accordion from "../shared/Accordion.svelte";
  import { v4 as uuidv4 } from "uuid";
  import { onMount } from "svelte";
  import socket from "../scripts/socketio";
  import { config } from "../config.js";

  let fields = { sun_set_rise_url: "" };
  let valid = false;

  const fetchType = {
    SUBMIT: "submit",
    SUNRISESET_TEST: "sunriseset-test",
  };

  const fetch_handler = async (type) => {
    try {
      let url = undefined,
        body = undefined,
        method = undefined;
      switch (type) {
        case fetchType.SUBMIT:
          method = "PUT",
          url = "/api/settings";
          body = JSON.stringify(fields);
        case fetchType.SUNRISESET_TEST:
          method = "PUT"
          url = "/api/test";
          body = JSON.stringify({ topic: "sunriseset" });
      }
      if (url) {
        const res = await fetch(`${url}?api-key=${config.api_key}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (res.status === 200) {
          const ret = await res.json();
          if (ret.status) {
            console.log("success", ret.data);
          } else {
            console.log("error", ret.data);
          }
        } else {
          console.log("Error", res.status, res.statusText);
        }
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const event_sun_rise_set = () => {
    socket.emit("test", { event: "sun_rise_set" });
  };

  onMount(async () => {
    const res = await fetch("/api/settings?api-key=foo");
    const settings = await res.json();
    fields.sun_set_rise_url = settings.sun_set_rise_url;
  });
</script>

<Accordion>
  <span slot="head">Instellingen</span>
  <div slot="details">
    <form on:submit|preventDefault={() => fetch_handler(fetchType.SUBMIT)}>
      <div class="form-field">
        <label for="sun-set-rise">Sunset-sunrise URL:</label>
        <input type="text" id="sun-set-rise" bind:value={fields.sun_set_rise_url} />
      </div>
      <Button type="secondary">Save</Button>
    </form>
  </div>
</Accordion>
<Accordion>
  <span slot="head">Test</span>
  <div slot="details">
    <Button on:click={() => fetch_handler(fetchType.SUNRISESET_TEST)}>Get sunrise and sunset</Button>
  </div>
</Accordion>

<style>
  form {
    width: 100%;
  }
  .form-field {
    margin: 18px auto;
  }
  input {
    width: 100%;
    border-radius: 6px;
  }
</style>
