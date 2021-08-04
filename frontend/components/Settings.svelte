<script>
  import Button from "../shared/Button.svelte";
  import Accordion from "../shared/Accordion.svelte";
  import { onMount } from "svelte";
  import socket from "../scripts/socketio";
  import { config } from "../config.js";
  import { getNotificationsContext } from "svelte-notifications";
  import { get_settings} from "../scripts/data";
  import { text } from "svelte/internal";
  const { addNotification } = getNotificationsContext();


  let setting_fields = {};

  let valid = false;
  let sun_timing = { rise: "", set: "" };
  let temperature;

  const show_message = (text, type) => {
    const config = { text, type, position: "top-center" };
    if (type === "success") config.removeAfter = 1000;
    addNotification(config);
  };

  const decode_response = async (response) => {
    if (response.status === 200) {
      const ret = await response.json();
      if (ret.status) {
        return ret.value;
      } else {
        alert(ret.message);
      }
    } else {
      alert(`Error: ${response.status} ${response.statusText}`);
    }
    return false;
  };

  const save_settings = async () => {
    const res = await fetch(`/api/batch/settings?api-key=${config.api_key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting_fields),
    });
    const value = await decode_response(res);
    if (value) {
      show_message("Instellingen zijn bewaard", "success");
    } else {
      show_message("Fout, instellingen zijn niet bewaard", "danger");
    }
  };

  const execute_test = async (test) => {
    const res = await fetch(`/api/test?api-key=${config.api_key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: test,
      }),
    });
    const value = await decode_response(res);
    console.log(value);
  };

  onMount(async () => {
    get_settings().then(settings => setting_fields = settings);
    const fetch_temperature = await fetch("/api/info/temperature?api-key=foo");
    let data = await fetch_temperature.json();
    if (data.status) {
      temperature = data.value;
    } else {
      alert(data.message);
    }
  });

  socket.on("sun-timing", (ret) => {
    if (ret.status) {
      sun_timing.rise = ret.data.sunrise;
      sun_timing.set = ret.data.sunset;
    } else {
      alert(ret.message);
    }
  });
</script>

<Accordion>
  <span slot="head">Instellingen</span>
  <div slot="details">
    <form on:submit|preventDefault={save_settings}>
      <div class="form-field">
        <label for="location-latitude">Latitude:</label>
        <input type="text" id="location-latitude" bind:value={setting_fields.location_latitude} />
      </div>
      <div class="form-field">
        <label for="location-longitude">Longitude:</label>
        <input type="text" id="location-longitude" bind:value={setting_fields.location_longitude} />
      </div>
      <div class="form-field">
        <label for="update-cron-pattern"
          >Cron patroon (regelmatig opvragen van zonsopgang en -ondergang tijdstippen):</label
        >
        <input type="text" id="update-cron-pattern" bind:value={setting_fields.update_cron_pattern} />
      </div>
      <div class="form-field">
        <label for="door-to">Deur: maximum verwachtte transitietijd (s):</label>
        <input type="text" id="door-to" bind:value={setting_fields.door_to} />
      </div>
      <div class="form-field">
        <label for="anim-door-duration">Deur animatie duur (s):</label>
        <input type="text" id="anim-door-duration" bind:value={setting_fields.anim_door_duration} />
      </div>
      <div class="form-field">
        <label for="sun-rise-offset">Zonsopgang aanpassing, kan negatief zijn (s):</label>
        <input type="text" id="sun-rise-offset" bind:value={setting_fields.sun_rise_offset} />
      </div>
      <div class="form-field">
        <label for="sun-set-offset">Zonsondergang aanpassing, kan negatief zijn (s):</label>
        <input type="text" id="sun-set-offset" bind:value={setting_fields.sun_set_offset} />
      </div>
      <Button type="secondary">Save</Button>
    </form>
  </div>
</Accordion>
<Accordion>
  <span slot="head">Test</span>
  <div slot="details">
    <div class="form-field">
      <label for="sun-rise">Zonsopgang:</label>
      <input type="text" id="sun-rise" bind:value={sun_timing.rise} />
    </div>
    <div class="form-field">
      <label for="sun-set">Zonsondergang:</label>
      <input type="text" id="sun-set" bind:value={sun_timing.set} />
    </div>
    <Button on:click={() => execute_test("sun-timing")}>Get sunrise and sunset</Button>
    <Button on:click={() => execute_test("door-timeout")}>Test door open/close timeout</Button>
    <div class="form-field">
      <label for="temperature">Temperatuur (°C):</label>
      <input type="text" id="temperature" bind:value={temperature} />
    </div>
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
