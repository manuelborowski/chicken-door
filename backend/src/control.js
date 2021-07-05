import logger from './logger.js';
import fetch from 'node-fetch';
import { config } from "../config.js"

const doorState = {
  OPEN: 'open',
  CLOSED: 'closed'
};

class Socketio {
  init(socket) {
    this.socket = socket;
    this.socket.on("main", d => {
      console.log("door is ", d.door);
      logger.info(`Door is going to state: ${d.door}`);
      this.socket.emit("main", d);
    });
  }

  deinit() { }
}


class Test {
  constructor(control) {
    this.control = control;
  }

  execute(data) {
    switch (data.topic) {
      case "sunriseset":
        console.log("executing sun rise and set test");
        this.control.get_sun_timing().then(ret => console.log(ret);
        return ret;
    }
  }
}


class Control {
  door_state = doorState.OPEN;

  constructor() {
    this.socket = new Socketio();
    this.test = new Test(this);
  }

  async get_sun_timing() {
    const get_public_ip = await fetch('https://api.ipify.org?format=json')
    if (get_public_ip.status === 200) {
      const decode_public_ip = await get_public_ip.json();
      console.log('public ip is ', decode_public_ip);
      const get_location = await fetch(`https://geocode.xyz?locate=${decode_public_ip.ip}&geoit=JSON`);
      if (get_location.status === 200) {
        const decode_location = await get_location.json();
        console.log('location', decode_location.latt, decode_location.longt);
        const get_sun_timing = await fetch(`https://api.sunrise-sunset.org/json?lat=${decode_location.latt}&lng=${decode_location.longt}&formatted=0`);
        if (get_sun_timing.status === 200) {
          const decode_sun_timing = await get_sun_timing.json();
          console.log('sunset and sunrise', decode_sun_timing.results.sunset, decode_sun_timing.results.sunrise);
          const sunset = new Date(decode_sun_timing.results.sunset);
          const sunrise = new Date(decode_sun_timing.results.sunrise);
          let ret = {status: true, data: {sunrise: sunrise.toTimeString(), sunset: sunset.toTimeString()}};
          return ret;

          // const get_utc_offset = await fetch(`https://timezone.abstractapi.com/v1/current_time/?api_key=${config.abstractapi_key}&location=${decode_location.latt},${decode_location.longt}`);
          // if (get_utc_offset.status === 200) {
          //   const decode_utc_offset = await get_utc_offset.json();
          //   console.log('UCT offset is ', decode_utc_offset.gmt_offset);
          // }
        }
      }
    }
  }
}

export default new Control();