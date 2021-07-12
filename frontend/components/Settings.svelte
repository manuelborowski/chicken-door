<script>
  import Button from "../shared/Button.svelte";
  import Accordion from "../shared/Accordion.svelte";
  import { onMount } from "svelte";
  import socket from "../scripts/socketio";
  import { config } from "../config.js";

  let setting_fields = {
    latitude: "",
    longitude: "",
  };

  let valid = false;
  let sun_timing = { rise: "", set: "" };

  const actionType = {
    save_settings: {
      endpoint: "settings",
      body: setting_fields,
    },
    get_sun_timings: {
      endpoint: "test",
      body: { topic: "sun-timing" },
    },
  };

  const action_handler = async (action) => {
    try {
      const res = await fetch(`\api\\${action.endpoint}?api-key=${config.api_key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: json(action.body),
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
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const decode_response = async response => {
    if (response.status === 200) {
      const ret = await response.json();
      if (ret.status) {
        return ret.value;
      } else {
        alert(ret.message);
      }
    } else {
      alert(`Error: ${res.status} ${res.statusText}`);
    }
    return false;
  }

  const save_settings = async () => {
    const res = await fetch(`/api/batch/settings?api-key=${config.api_key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "location-longitude": setting_fields.longitude,
        "location-latitude": setting_fields.latitude
      }),
    });
    const value = await decode_response(res);
    console.log(value);
  };

  const get_sun_timings = async () => {
    const res = await fetch(`/api/test?api-key=${config.api_key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "sun-timing",
      }),
    });
    const value = await decode_response(res);
    console.log(value);
  };

  onMount(async () => {
    const fetch_settings = await fetch("/api/settings?api-key=foo");
    const data = await fetch_settings.json();
    if (data.status) {
      setting_fields.longitude = data.value["location-longitude"];
      setting_fields.latitude = data.value["location-latitude"];
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
        <input type="text" id="location-latitude" bind:value={setting_fields.latitude} />
      </div>
      <div class="form-field">
        <label for="location-longitude">Longitude:</label>
        <input type="text" id="location-longitude" bind:value={setting_fields.longitude} />
      </div>
      <Button type="secondary">Save</Button>
    </form>
  </div>
</Accordion>
<Accordion>
  <span slot="head">Zonsopgang en ondergang</span>
  <div slot="details">
    <div class="form-field">
      <label for="sun-rise">Zonsopgang:</label>
      <input type="text" id="sun-rise" bind:value={sun_timing.rise} />
    </div>
    <div class="form-field">
      <label for="sun-set">Zonsondergang:</label>
      <input type="text" id="sun-set" bind:value={sun_timing.set} />
    </div>
    <Button on:click={get_sun_timings}>Get sunrise and sunset</Button>
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
