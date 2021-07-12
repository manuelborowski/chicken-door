import logger from './logger.js';
import fetch from 'node-fetch';
import data from './data.js';

const doorState = {
  OPEN: 'open',
  CLOSED: 'closed'
};


class Test {
  constructor(control) {
    this.control = control;
  }

  init(socket) {
    this.io = socket.server;
    this.socket = socket;
  }

  async execute(data) {
    switch (data.topic) {
      case "sun-timing":
        return this.control.get_sun_timing()
    };
  }
}

class Control {
  door_state = doorState.OPEN;
  constructor() {
    if (!Control.instance) {
      this.test = new Test(this);
      Control.instance = this;
    }
    return Control.instance;
  }

  init(socket) {
    this.io = socket.server;
    this.socket = socket;
    socket.on("door", d => {
      console.log("door is ", d.door);
      logger.info(`Door is going to state: ${d.door}`);
      this.io.emit("door", d); // broadcast to all clients
    });
    this.test.init(socket);
  }

  get_sun_timing = async () => {
    const longitude = await data.settings.get('location-longitude');
    const latitude = await data.settings.get('location-latitude');
    const get_sun_timing = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
    if (get_sun_timing.status === 200) {
      const decode_sun_timing = await get_sun_timing.json();
      const sunset = new Date(decode_sun_timing.results.sunset);
      const sunrise = new Date(decode_sun_timing.results.sunrise);
      logger.info('sunset and sunrise', sunset, sunrise);
      let ret = { status: true, data: { sunrise: sunrise.toTimeString(), sunset: sunset.toTimeString() }};
      const event = await this.io.emit('sun-timing', ret);
      return true;
    } else {
      throw new Error(`fetch from api.sunrise-sunset.org returned: ${get_sun_timing.status} ${get_sun_timing.statusText}`);
    }
  }
}

const control = new Control;
export default control;