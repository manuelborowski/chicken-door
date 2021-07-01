        <script>
  import Button from "../shared/Button.svelte";
  import Accordion from "../shared/Accordion.svelte";
  import { v4 as uuidv4 } from "uuid";
  import { onMount } from "svelte";
  import  sio from "../scripts/socketio"

  let fields = { sun_set_rise_url: "" };
  let valid = false;

  const submit_handler = async () => {
    try {
      const res = await fetch("/api/settings?api-key=foo", {
        method: "PUT", // or 'PUT'
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      });
      if (res.status === 200) {
        const ret = await res.json();
        if (ret.status) {
          console.log("success", ret.data);
        } else {
          console.log("error", ret.data);
          alert(ret.data);
        }
      } else {
        console.log("Error", res.status, res.statusText);
      }
      sio.socket.emit('sio','Hi over there');
    } catch (error) {
      console.log("Error:", error);
    }
  };

  onMount(async () => {
    const res = await fetch("/api/settings?api-key=foo");
    const settings = await res.json();
    console.log("value is ", settings);

    fields.sun_set_rise_url = settings.sun_set_rise_url;

  });
</script>

<Accordion>
  <span slot="head">Instellingen</span>
  <div slot="details">
    <form on:submit|preventDefault={submit_handler}>
      <div class="form-field">
        <label for="sun-set-rise">Sunset-sunrise URL:</label>
        <input type="text" id="sun-set-rise" bind:value={fields.sun_set_rise_url} />
      </div>
      <Button type="secondary">Save</Button>
    </form>
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
