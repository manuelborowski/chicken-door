import logger from './logger.js';

const doorState = {
  OPEN: 'open',
  CLOSED: 'closed'
};

class Control {
  door_state = doorState.OPEN;

  constructor() {
  }

  init_socketio(socket) {
    this.socket = socket;
    this.socket.on("main", d => {
      console.log("door is ", d.door);
      logger.info(`Door is going to state: ${d.door}`);
      this.socket.emit("main", d);
    });
  }

  deinit_socketio() {
  }
}

export default new Control();