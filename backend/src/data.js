import MongoClient from 'mongodb';
import logger from './logger.js';
import { default_settings } from '../config.js';

class Settings {
  constructor() {
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

  async put(key, value) {
      if (key in default_settings) {
        const query = {key};
        const doc = {value};
        await this.setting_collection.updateOne(query, key)
        logger.info(`updated setting key: ${key}, value: ${value}`);
        return true;
      } 
      throw new Error(`strict is true and setting '${key}' is new`);
    const doc = {key, value};
    await this.setting_collection.insertOne(doc);
    logger.info(`added setting key: ${key}, value: ${value}`);
    return true;
  }

  put_all(settings, strict = false) {
    for (const [key, value] of Object.entries(settings)) {
      this.put(key, value, strict);
    }
  }

  async init() {
    const database = await MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true });
    this.db = database.db("chicken-door-db");
    this.setting_collection = this.db.collection('Setting');
    const keys = Object.entries(default_settings).map(([k, v]) => k);
    const number = await this.setting_collection.countDocuments({key: {$in: keys}});
    if (number < keys.length) {
      const settings = await this.setting_collection.find({key: {$in: keys}});
      settings.forEach(setting => {
        console.log(setting);
      });
    }


  }

  store_default_settings() {
    // const keys = Object.entries(default_settings).map(([k, v]) => k);
    // const settings = await this.setting_collection.find({key: {$in: keys}});
  }
}

class Data {
  constructor() {
    this.settings = new Settings();
  }
}

export default new Data();