import MongoClient from 'mongodb';
import logger from './logger.js';
import { default_settings } from '../config.js';

class Settings {
  constructor() {
  }

  async get(key) {
    if (!(key in default_settings)) { throw new Error(`'${key}' is not a valid setting`); }
    let setting = await this.setting_collection.findOne({ key })
    return setting.value;
  }

  get_all() {
    let settings = {};
    this.settings.forEach(s => settings[s.key] = s.value);
    return settings;
  }

  async update(key, value) {
    if (!(key in default_settings)) { throw new Error(`'${key}' is not a valid setting`); }
    const query = { key };
    const doc = { value };
    await this.setting_collection.updateOne({ key }, { value });
    logger.info(`updated setting key: ${key}, value: ${value}`);
    return true;
  }

  put_all(settings, strict = false) {
    for (const [key, value] of Object.entries(settings)) {
      this.update(key, value, strict);
    }
  }

  async init() {
    const database = await MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true });
    this.db = database.db("chicken-door-db");
    this.setting_collection = this.db.collection('Setting');
    let keys = Object.entries(default_settings).map(([k, v]) => k);

    keys.forEach(async key => {
      const setting = await this.setting_collection.findOne({ key });
      if (setting == null) {
        const value = default_settings[key];
        await this.setting_collection.insertOne({ key, value });
        logger.info(`added setting key: ${key}, value: ${value}`);
      }
    });
  }
}

class Data {
  constructor() {
    this.settings = new Settings();
  }

  async init() {
    await this.settings.init();
  }
}

export default new Data();