import logger from './logger.js';
import fetch from 'node-fetch';
import data from './data.js';
import cron from 'node-cron';
import { createMachine, interpret } from 'xstate';

const doorEvents = {
  OPEN: "open",
  OPENING: "opening",
  CLOSED: "closed",
  CLOSING: "closing",
  ERROR: "error",
  GET_STATE: "get_state",
};

class Test {
  constructor(control) {
    this.control = control;
  }

  use_socket(socket) {
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

class DoorTest {
  door_delay = 4000;
  open_door = async () => {
    console.log('DOOR TEST: door is opening');
    return new Promise((resolve, reject) => {
      setTimeout(() => { resolve('door is open') }, this.door_delay);
    });
  }
  close_door = async () => {
    console.log('DOOR TEST: door is closing');
    return new Promise((resolve, reject) => {
      setTimeout(() => { resolve('door is closed') }, this.door_delay);
    });
  }
}

class DoorFSM {
  door_to = 3000;
  constructor(control) {
    this.control = control;
    this.machine = createMachine({
      id: 'chicken-door',
      initial: 'undefined',
      states: {
        undefined: {
          on: {
            FORCE_OPEN: 'open',
            FORCE_CLOSE: 'closed',
          }
        },
        open: {
          on: {
            START_CLOSING: 'closing',
          },
          entry: ['enter_open',]
        },
        closing: {
          on: {
            START_OPENING: 'opening',
            IS_CLOSED: 'closed',
            TIMEOUT: 'error',
          },
          entry: ['enter_closing',]
        },
        closed: {
          on: {
            START_OPENING: 'opening',
          },
          entry: ['enter_closed',]
        },
        opening: {
          on: {
            START_CLOSING: 'closing',
            IS_OPEN: 'open',
            TIMEOUT: 'error',
          },
          entry: ['enter_opening']
        },
        error: {
          on: {
            START_OPENING: 'opening',
            START_CLOSING: 'closing',
          },
          entry: ['enter_error',]
        }
      }
    },
      {
        actions: {
          enter_open: (context, event) => {
            console.log('FSM: entering open');
            clearTimeout(this.door_timer);
            this.out_is_open_cb(this.service.state.value);
          },
          enter_closing: (context, event) => {
            console.log('FSM: entering closing');
            data.settings.get('door_to').then(to => this.door_timer = setTimeout(() => this.service.send('TIMEOUT'), to));
            this.out_closing_cb(this.service.state.value);
          },
          enter_closed: (context, event) => {
            console.log('FSM: entering closed');
            clearTimeout(this.door_timer);
            this.out_is_closed_cb(this.service.state.value);
          },
          enter_opening: (context, event) => {
            console.log('FSM: entering opening');
            data.settings.get('door_to').then(to => this.door_timer = setTimeout(() => this.service.send('TIMEOUT'), to));
            this.out_opening_cb(this.service.state.value);
          },
          enter_error: (context, event) => {
            console.log('FSM entering error');
            this.out_error_cb(this.service.state.value);
          }
        }
      }
    );
  }

  event_start_opening() {
    this.service.send('START_OPENING');
  }

  event_start_closing() {
    this.service.send('START_CLOSING');
  }

  event_is_open() {
    this.service.send('IS_OPEN');
  }

  event_is_closed() {
    this.service.send('IS_CLOSED');
  }

  event_force_open() {
    this.service.send('FORCE_OPEN');
  }

  event_force_close() {
    this.service.send('FORCE_CLOSE');
  }

  get_current_state() { return this.service.state.value; }

  init(opening_cb, closing_cb, is_open_cb, is_closed_cb, error_cb) {
    this.out_opening_cb = opening_cb;
    this.out_closing_cb = closing_cb;
    this.out_is_open_cb = is_open_cb;
    this.out_is_closed_cb = is_closed_cb;
    this.out_error_cb = error_cb;
    this.service = interpret(this.machine);
    this.service.start();
  }
}

class Control {
  door_state = doorEvents.OPEN;
  constructor() {
    if (!Control.instance) {
      this.test = new Test(this);
      this.machine = new DoorFSM(this);
      this.door_test = new DoorTest();
      Control.instance = this;
    }
    return Control.instance;
  }

  init(io) {
    this.io = io;
    this.machine.init(this.out_opening_cb, this.out_closing_cb, this.out_is_open_cb, this.out_is_closed_cb, this.out_error_cb);
    data.settings.subscribe_on_update("update_cron_pattern", this.update_setting_cb, null);
    data.settings.get("update_cron_pattern")
      .then(pattern => {this.update_job = cron.schedule(pattern, this.update_function);});
    
    if (Math.floor(Math.random() * 2) === 0) {
      console.log('start with door OPEN');
      this.machine.event_force_open();
    }else {
      console.log('start with door CLOSED');
      this.machine.event_force_close();
    }
  }

  //Called each time the client is opened or refreshes screen => a new socket is created.
  use_socket(socket) {
    socket.on("door", event => {
      console.log("DOOR: received event: ", event);
      if (event === doorEvents.GET_STATE) {
        const current_state = this.machine.get_current_state();
        this.io.emit("door", current_state);
      } else {
        logger.info(`Door is going to state: ${event}`);
        if (event === doorEvents.OPENING) {
          this.machine.event_start_opening();
        }
        if (event === doorEvents.CLOSING) {
          this.machine.event_start_closing();
        }
      }
    });
    this.test.use_socket(socket);
    this.update_function();
  }

  update_setting_cb = (key, value, opaque) => {
    try {
      this.update_job.stop()
      this.update_job = cron.schedule(value, this.update_function)
    } catch (e) { console.log('erorr: ', e.message); }
  }

  update_function = () => {
    console.log('update_function called on ', new Date());
    this.get_sun_timing();
    this.set_door_timeout();
  }

  get_sun_timing = async () => {
    const longitude = await data.settings.get('location_longitude');
    const latitude = await data.settings.get('location_latitude');
    const get_sun_timing = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
    if (get_sun_timing.status === 200) {
      const decode_sun_timing = await get_sun_timing.json();
      const sunset = new Date(decode_sun_timing.results.sunset);
      const sunrise = new Date(decode_sun_timing.results.sunrise);
      logger.info('sunset and sunrise', this.sunset, this.sunrise);
      await data.settings.update('sun_rise', sunrise.toLocaleTimeString());
      await data.settings.update('sun_set', sunset.toLocaleTimeString());
      let ret = { status: true, data: { sunrise: sunrise.toLocaleString(), sunset: sunset.toLocaleString() } };
      await this.io.emit('sun-timing', ret);
      return true;
    } else {
      throw new Error(`fetch from api.sunrise-sunset.org returned: ${get_sun_timing.status} ${get_sun_timing.statusText}`);
    }
  }

  set_door_timeout = async () => {
    const now = new Date();
    const now_minutes = now.getHours() * 60 + now.getMinutes();
    let sun_setting = await data.settings.get('sun_rise');
    let sun_split = sun_setting.split(":");
    let rise_minutes = parseInt(sun_split[0]) * 60 + parseInt(sun_split[1]);
    sun_setting = await data.settings.get('sun_set');
    sun_split = sun_setting.split(":");
    let set_minutes = parseInt(sun_split[0]) * 60 + parseInt(sun_split[1]);
    rise_minutes = (now_minutes >= rise_minutes) ? rise_minutes + 24 * 60 : rise_minutes;
    set_minutes = (now_minutes >= set_minutes) ? set_minutes + 24 * 60 : set_minutes;
    if(this.timer_door_open != null) {
      clearTimeout(this.timer_door_open);
      this.timer_door_open = null;
    }
    if(this.timer_door_close != null) {
      clearTimeout(this.timer_door_close);
      this.timer_door_close = null;
    }
    this.timer_door_open = setTimeout(() => this.machine.event_start_opening, (rise_minutes - now_minutes) * 60 * 1000);
    this.timer_door_close = setTimeout(() => this.machine.event_start_closing, (set_minutes  - now_minutes) * 60 * 1000);
  }

  out_opening_cb = state => {
    console.log('CONTROL: out_opening_cb');
    this.io.emit("door", state);
    this.door_test.open_door().then(r => {
      console.log('CONTROL: door is OPENED');
      this.machine.event_is_open();
    });
  }

  out_closing_cb = state => {
    console.log('CONTROL: out_closing_cb');
    this.io.emit("door", state);
    this.door_test.close_door().then(r => {
      console.log('CONTROL: door is CLOSED');
      this.machine.event_is_closed();
    });
  }

  out_is_open_cb = state => {
    this.io.emit("door", state);
  }

  out_is_closed_cb = state => {
    this.io.emit("door", state);
  }

  out_error_cb = state => {
    this.io.emit("door", state);
  };
}

const control = new Control;
export default control;