import logger from './logger.js';
import fetch from 'node-fetch';
import { config } from "../config.js"

const doorState = {
  OPEN: 'open',
  CLOSED: 'closed'
};


class Test {
  constructor(control, socket) {
    this.control = control;
    this.socket = socket;
  }

  execute(data) {
    switch (data.topic) {
      case "sun-timing":
        this.control.get_sun_timing().then(ret => {
          // ret = { status: true, data: { sunrise: 'op', sunset: 'onder' } };

          console.log('get_sun_timing returns: ', ret);
          this.socket.emit('sun-timing', ret);
        }).catch(e => console.log(e.message));
        return { status: true, data: '' }
    };
  }
}


class Control {
  door_state = doorState.OPEN;
  init(socket) {
    this.test = new Test(this, socket);
    this.socket = socket;

    socket.on("door", d => {
      console.log("door is ", d.door);
      logger.info(`Door is going to state: ${d.door}`);
      socket.emit("door", d);
    });
  }

  get_sun_timing = async () => {
    console.log('before public ip');
    // const get_public_ip = await fetch('https://api.ipify.org?format=json')
    console.log('after public ip');
    // if (get_public_ip.status === 200) {
    if (true) {
      // let decode_public_ip = await get_public_ip.json();
      let decode_public_ip = '84.199.90.82'
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
          let ret = { status: true, data: { sunrise: sunrise.toTimeString(), sunset: sunset.toTimeString() } };
          const event = await this.socket.emit('sun-timing', ret);
          return ret;
          // const decode_sun_timing = await get_sun_timing.json();
          // console.log('sunset and sunrise', decode_sun_timing.results.sunset, decode_sun_timing.results.sunrise);
          // const sunset = new Date(decode_sun_timing.results.sunset);
          // const sunrise = new Date(decode_sun_timing.results.sunrise);
          // let ret = { status: true, data: { sunrise: sunrise.toTimeString(), sunset: sunset.toTimeString() } };
          // return ret;

          // const get_utc_offset = await fetch(`https://timezone.abstractapi.com/v1/current_time/?api_key=${config.abstractapi_key}&location=${decode_location.latt},${decode_location.longt}`);
          // if (get_utc_offset.status === 200) {
          //   const decode_utc_offset = await get_utc_offset.json();
          //   console.log('UCT offset is ', decode_utc_offset.gmt_offset);
          // }
        }
      }
    }
    return {status: false}
  }
}

export default new Control();