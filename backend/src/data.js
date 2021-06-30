class Settings {
  constructor() {
    this.settings = [
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" }
    ]
  }

  get(key) {
    let setting = this.settings.find(s => s.key === key);
    let value = setting === undefined ? '' : setting.value;
    return value;
  }

  get_all() {
    let settings = {};
    this.settings.forEach(s => settings[s.key] = s.value);
    return settings;
  }

  put(key, value, strict = false) {
    let setting = this.settings.find(s => s.key === key);
    if (setting === undefined) {
      if (strict) { 
        throw('strict is true and setting is new');
      } else {
        this.settings.push({ key, value });
      }
    } else {
      setting.value = value;
    }
  }

  put_all(settings, strict=false) {
    for (const [key, value] of Object.entries(settings)) {
      this.put(key, value, strict);
    }
  }
}

class Data {
  constructor() {
    this.settings = new Settings();
  }
}

export default new Data();