import logger from './logger.js';
import fetch from 'node-fetch';
import data from './data.js';
import cron from 'node-cron';
import {createMachine, interpret} from 'xstate';
import {Gpio} from 'onoff';
import child_process from 'child_process';

const doorState = {
  OPEN: "open",
  OPENING: "opening",
  CLOSED: "closed",
  CLOSING: "closing",
  ERROR: "error",
  STOPPED_OPENING: "stopped_opening",
  STOPPED_CLOSING: "stopped_closing",
}
const frontEndEvent = {
  BTN_OPEN: "btn_open",
  BTN_CLOSE: "btn_close",
  BTN_DOOR: "btn_door",
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
        return this.control.update_timings_and_delays();
        break;
      case "door-timeout":
        return this.control.set_door_timeout(true);
        break;
    }
  }
}

class DoorTest {
  door_delay = 4000;

  constructor(control) {
    this.control = control;
  }

  init = () => {
    this.control.machine.register_callback(this.out_action_cb, null)
    if (Math.floor(Math.random() * 2) === 0) {
      logger.info('start with door OPEN');
      this.control.machine.event_is_open();
    } else {
      logger.info('start with door CLOSED');
      this.control.machine.event_is_closed();
    }
  }

  open_door = () => {
    logger.info('DOOR TEST: door is opening');
    setTimeout(this.control.machine.event_is_open, this.door_delay);
  }

  close_door = () => {
    logger.info('DOOR TEST: door is closing');
    setTimeout(this.control.machine.event_is_closed, this.door_delay);
  }

  out_action_cb = (state, opaque) => {
    logger.info(`DOOR TEST: statemachine goes to: ${state}`);
    switch (state) {
      case 'opening':
        this.open_door();
        break;
      case 'closing':
        this.close_door();
        break;
    }
  }
}

class DoorGpio {
  door_delay = 4000;

  constructor(control) {
    this.control = control;
    this.out_motor_open = new Gpio(27, 'out');
    this.out_motor_close = new Gpio(17, 'out');
    this.out_motor_enable = new Gpio(22, 'out');
    this.in_door_opened = new Gpio(23, 'in', 'rising', {debounceTime: 50});
    this.in_door_closed = new Gpio(24, 'in', 'rising', {debounceTime: 50});
    this.in_open_door_btn = new Gpio(5, 'in', 'falling', {debounceTime: 50});
    this.in_close_door_btn = new Gpio(6, 'in', 'falling', {debounceTime: 50});
  }

  init = () => {
    child_process.spawn('gpio', ['-g', 'mode', '23', 'up']);
    child_process.spawn('gpio', ['-g', 'mode', '24', 'up']);
    child_process.spawn('gpio', ['-g', 'mode', '5', 'up']);
    child_process.spawn('gpio', ['-g', 'mode', '6', 'up']);
    this.in_door_opened.watch((err, value) => {
      logger.info('DOOR GPIO: door is open');
      this.out_motor_close.writeSync(0);
      this.out_motor_open.writeSync(0);
      this.out_motor_enable.writeSync(0);
      this.control.machine.event_is_open();
    });
    this.in_door_closed.watch((err, value) => {
      logger.info('DOOR GPIO: door is closed');
      this.out_motor_close.writeSync(0);
      this.out_motor_open.writeSync(0);
      this.out_motor_enable.writeSync(0);
      this.control.machine.event_is_closed();
    });
    this.in_open_door_btn.watch((err, value) => this.control.react_on_frontend_event(frontEndEvent.BTN_OPEN));
    this.in_close_door_btn.watch((err, value) => this.control.react_on_frontend_event(frontEndEvent.BTN_CLOSE));
    this.control.machine.register_callback(this.out_action_cb, null);
    const door_is_open = this.in_door_opened.readSync();
    const door_is_closed = this.in_door_closed.readSync();
    if (door_is_open === 1) {
      if (door_is_closed === 0) this.control.machine.event_is_open();
    } else {
      if (door_is_closed === 0) {
        this.control.machine.event_is_stopped();
      } else {
        this.control.machine.event_is_closed();
      }
    }
  }

  open_door = () => {
    logger.info('DOOR GPIO: door is opening');
    this.out_motor_close.writeSync(0);
    this.out_motor_open.writeSync(1);
    this.out_motor_enable.writeSync(1);
  }

  close_door = () => {
    logger.info('DOOR GPIO: door is closing');
    this.out_motor_open.writeSync(0);
    this.out_motor_close.writeSync(1);
    this.out_motor_enable.writeSync(1);
  }

  stop_door = () => {
    logger.info('DOOR GPIO: door is stopped');
    this.out_motor_open.writeSync(0);
    this.out_motor_close.writeSync(0);
    this.out_motor_enable.writeSync(0);
  }

  out_action_cb = (state, opaque) => {
    switch (state) {
      case 'opening':
        this.open_door();
        break;
      case 'closing':
        this.close_door();
        break;
      case 'stopped_opening':
      case 'stopped_closing':
      case 'error':
        this.stop_door();
        break;
    }
  }
}

class DoorFSM {
  constructor(control) {
    this.control = control;
    this.machine = createMachine({
        id: 'chicken-door',
        initial: 'init',
        states: {
          init: {
            on: {
              STOP: 'stopped_opening',
              IS_OPEN: 'open',
              IS_CLOSED: 'closed'
            }
          },
          stopped_opening: {
            on: {
              DOOR: 'closing',
              START_OPENING: 'opening',
              START_CLOSING: 'closing'
            },
            entry: ['clear_timer', 'invoke_state_callback']
          },
          stopped_closing: {
            on: {
              DOOR: 'opening',
              START_OPENING: 'opening',
              START_CLOSING: 'closing'
            },
            entry: ['clear_timer', 'invoke_state_callback']
          },
          open: {
            on: {
              START_CLOSING: 'closing',
              DOOR: 'closing',
            },
            entry: ['clear_timer', 'invoke_state_callback']
          },
          closing: {
            on: {
              START_OPENING: 'opening',
              IS_CLOSED: 'closed',
              DOOR: 'stopped_closing',
              START_CLOSING: 'stopped_closing',
              TIMEOUT: 'error',
            },
            entry: ['start_timer', 'invoke_state_callback']
          },
          closed: {
            on: {
              START_OPENING: 'opening',
              DOOR: 'opening',
            },
            entry: ['clear_timer', 'invoke_state_callback']
          },
          opening: {
            on: {
              START_CLOSING: 'closing',
              IS_OPEN: 'open',
              DOOR: 'stopped_opening',
              START_OPENING: 'stopped_opening',
              TIMEOUT: 'error',
            },
            entry: ['start_timer', 'invoke_state_callback']
          },
          error: {
            on: {
              START_OPENING: 'opening',
              START_CLOSING: 'closing',
            },
            entry: ['clear_timer', 'invoke_state_callback']
          }
        }
      },
      {
        actions: {
          invoke_state_callback: (context, event) => {
            console.log(`FSM: entering state: ${this.service.state.value}, via event: ${event.type}`);
            logger.info(`FSM: entering state: ${this.service.state.value}, via event: ${event.type}`);
            this.invoke_callbacks();
          },
          clear_timer: (context, event) => {
            clearTimeout(this.door_timer);
            this.door_timer = null;
          },
          start_timer: (context, event) => {
            if (this.door_timer !== null) {
              clearTimeout(this.door_timer);
            }
            data.settings.get('door_to').then(to => this.door_timer = setTimeout(() => this.service.send('TIMEOUT'), parseInt(to) * 1000));
          },
        }
      }
    );
  }

  event_door = () => {
    this.service.send('DOOR');
  }

  event_start_opening = () => {
    this.service.send('START_OPENING');
  }

  event_start_closing = () => {
    this.service.send('START_CLOSING');
  }

  event_is_open = () => {
    this.service.send('IS_OPEN');
  }

  event_is_closed = () => {
    this.service.send('IS_CLOSED');
  }

  event_is_stopped = () => {
    this.service.send('STOP');
  }

  get_current_state = () => this.service.state.value;

  init = () => {
    this.service = interpret(this.machine);
    this.service.start();
  }

  callbacks = [];
  register_callback = (cb, opaque) => {
    this.callbacks.push([cb, opaque]);
  }

  invoke_callbacks = () => {
    const state = this.service.state.value;
    this.callbacks.forEach(cb => cb[0](state, cb[1]));
  }
}

export class Control {
  door_state = doorState.OPEN;

  constructor(dont_use_gpio = false) {
    if (!Control.instance) {
      this.test = new Test(this);
      this.machine = new DoorFSM(this);
      this.door = dont_use_gpio ? new DoorTest(this) : new DoorGpio(this);
      Control.instance = this;
    }
    return Control.instance;
  }

  init = io => {
    this.machine.init();
    this.door.init();
    this.io = io;
    this.machine.register_callback(this.out_action_cb, null);
    data.settings.subscribe_on_update("update_cron_pattern", this.update_setting_cb, null);
    data.settings.get("update_cron_pattern")
      .then(pattern => {
        this.update_job = cron.schedule(pattern, this.update_timings_and_delays);
      });
  }

  //Called each time the client is opened or refreshes screen => a new socket is created.
  use_socket(socket) {
    socket.on("door", event => this.react_on_frontend_event(event));
    this.test.use_socket(socket);
    this.update_timings_and_delays();
  }

  react_on_frontend_event = event => {
    logger.info(`DOOR: received event: ${event}`);
    const current_state = this.machine.get_current_state();
    switch (event) {
      case frontEndEvent.GET_STATE:
        this.io.emit("door", current_state);
        break;
      case frontEndEvent.BTN_OPEN:
        this.machine.event_start_opening();
        break;
      case frontEndEvent.BTN_CLOSE:
        this.machine.event_start_closing();
        break;
      case frontEndEvent.BTN_DOOR:
        this.machine.event_door()
    }
  }

  update_setting_cb = (key, value, opaque) => {
    try {
      this.update_job.stop()
      this.update_job = cron.schedule(value, this.update_timings_and_delays)
    } catch (e) {
      logger.info(`update_setting_callback erorr: ${e.message}`);
    }
  }

  update_timings_and_delays = () => {
    logger.info(`update_function called on: ${new Date()}`);
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
      logger.info(`sunset and sunrise, ${sunset}, ${sunrise}`);
      const sunrise_string = sunrise.toLocaleTimeString("nl-BE");
      const sunset_string = sunset.toLocaleTimeString("nl-BE");
      await data.settings.update('sun_rise', sunrise_string);
      await data.settings.update('sun_set', sunset_string);
      let ret = {status: true, data: {sunrise: sunrise_string, sunset: sunset_string}};
      await this.io.emit('sun-timing', ret);
      return true;
    } else {
      throw new Error(`fetch from api.sunrise-sunset.org returned: ${get_sun_timing.status} ${get_sun_timing.statusText}`);
    }
  }

  set_door_timeout = async (test = false) => {
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
    const rise_offset = parseInt(await data.settings.get('sun_rise_offset'));
    const set_offset = parseInt(await data.settings.get('sun_set_offset'));

    if (this.timer_door_open != null) {
      clearTimeout(this.timer_door_open);
      this.timer_door_open = null;
    }
    if (this.timer_door_close != null) {
      clearTimeout(this.timer_door_close);
      this.timer_door_close = null;
    }
    let sun_rise_delay, sun_set_delay;
    if (test) {
      let door_to = parseInt(await data.settings.get('door_to'));
      sun_rise_delay = 5000;
      sun_set_delay = sun_rise_delay + door_to;
    } else {
      sun_rise_delay = (rise_minutes - now_minutes) * 60 + rise_offset;
      sun_set_delay = (set_minutes - now_minutes) * 60 + set_offset;
    }
    this.timer_door_open = setTimeout(this.machine.event_start_opening, sun_rise_delay * 1000);
    this.timer_door_close = setTimeout(this.machine.event_start_closing, sun_set_delay * 1000);
    logger.info(`sunrise delay (seconds): ${sun_rise_delay}, sunset delay (seconds): ${sun_set_delay}`);
  }

  out_action_cb = (state, opaque) => {
    logger.info(`CONTROL: statemachine goes to: ${state}`);
    this.io.emit("door", state);
  }
}