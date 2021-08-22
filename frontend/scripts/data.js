import { secret } from '../secret.js';

let setting_fields = {
  location_latitude: "",
  location_longitude: "",
  update_cron_pattern: "",
  door_to: "",
  sun_rise_offset: "",
  sun_set_offset: "",
  anim_door_duration: "",
};

export const get_settings = async () => {
  const fetch_settings = await fetch(`/api/settings?api-key=${secret.api_key}`);
  let data = await fetch_settings.json();
  if (data.status) {
    Object.assign(setting_fields, data.value);
    return setting_fields;
  } else {
    alert(data.message);
  }
}

