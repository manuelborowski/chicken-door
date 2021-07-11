import { io } from "socket.io-client";
  

class Socket {
  constructor() {
    console.log('Try to create socket', new Date());
    if (!Socket.instance) {
      Socket.instance = this;
      this.socket = io();
      this.socket.on('connect', () => {
        console.log('Client is connected', this.socket.id);
      });
    }
    return Socket.instance;
  }
}

const socket = new Socket();
export default socket.socket;