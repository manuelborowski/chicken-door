import MongoClient from 'mongodb';
import logger from './logger.js';

const default_settings = {
  'location-latitude': '50.83540',
  'location-longitude': '4.34453',
}

class Settings {
  constructor() {
    MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, (err, database) => {
      if (err) throw err;
      this.db = database.db("chicken-door-db");
      this.setting_collection = this.db.collection('Setting');
    });
  }

  async get(key) {
    let setting = await this.setting_collection.findOne({key})
    if (setting == null) {
      if (key in default_settings) {
        await this.put(key, default_settings[key]);
        return default_settings[key];
      }
      throw new Error(`setting '${key}' does not exist`);
    }
    return setting.value;
  }

  get_all() {
    let settings = {};
    this.settings.forEach(s => settings[s.key] = s.value);
    return settings;
  }

  async put(key, value, strict = false) {
    if (strict) {
      if (key in default_settings) {
        const query = {key};
        const doc = {value};
        await this.setting_collection.updateOne(query, key)
        logger.info(`updated setting key: ${key}, value: ${value}`);
      } 
      throw new Error(`strict is true and setting '${key}' is new`);
    }
    const doc = {key, value};
    await this.setting_collection.insertOne(doc);
    logger.info(`added setting key: ${key}, value: ${value}`);
  }

  put_all(settings, strict = false) {
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