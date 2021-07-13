import MongoClient from 'mongodb';
import logger from './logger.js';
import { default_settings } from '../config.js';

class Settings {
  constructor() {
  }
  update_callbacks = [];
  subscribe_on_update(key, cb, opaque) {
    this.update_callbacks.push([key, cb, opaque]);
  }

  async get(key) {
    if (!(key in default_settings)) { throw new Error(`'${key}' is not a valid setting`); }
    let setting = await this.setting_collection.findOne({ key })
    return setting.value;
  }

  async get_all() {
    const raw_settings = await this.setting_collection.find({key: {$in: Object.keys(default_settings)}}).toArray();
    const settings = Object.fromEntries(raw_settings.map(e => [e.key, e.value]));
    return settings;
  }

  async update(key, value) {
    if (!(key in default_settings)) { throw new Error(`'${key}' is not a valid setting`); }
    const ret = await this.setting_collection.updateOne({ key }, {$set: { value }});
    logger.info(`updated setting key: ${key}, value: ${value}`);
    this.update_callbacks.forEach(([k, cb, opaque]) => {if (k == key) cb(key, value, opaque)});
    return true;
  }

  async update_all(settings) {
    for (const [key, value] of Object.entries(settings)) {
      this.update(key, value);
    }
    return true;
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
    if (!Data.instance) {
      this.settings = new Settings();
      Data.instance = this;
    }
    return Data.instance;
  }

  async init() {
    await this.settings.init();
  }
}

const data = new Data;
export default data;