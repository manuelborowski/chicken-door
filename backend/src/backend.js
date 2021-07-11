import express from 'express';
import cors from 'cors';
import path from 'path';
import data from './data.js';
import control from './control.js';
import http from 'http';
import { Server } from 'socket.io';
import logger from './logger.js';

var app = express()
app.use(cors())
app.use(express.static('public'));
app.use(express.json())


const server = http.Server(app);
const io = new Server(server);


logger.info('Starting chicken door');

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use('/api', function (req, res, next) {
  var key = req.query['api-key'];

  // key isn't present
  if (!key) return next(error(400, 'api key required'));

  // key is invalid
  if (!~apiKeys.indexOf(key)) return next(error(401, 'invalid api key'));

  // all good, store req.key for route access
  req.key = key;
  next();
});

var apiKeys = ['foo', 'bar', 'baz'];

const format_response = (promise, res) => {
  promise
    .then(value => res.json({ status: true, value }))
    .catch(e => res.json({ status: false, message: e.message }));
}

app.get('/api/settings', function (req, res, next) {
  let settings = data.settings.get_all();
  res.json(settings);
});


app.get('/api/settings/:key', function (req, res, next) {
  const key = req.params.key;
  format_response(data.settings.get(key), res);
});


app.put('/api/settings', function (req, res, next) {
  try {
    data.settings.put_all(req.body, true);
    res.json({ status: true, data: '' });
  }
  catch (e) {
    res.json({ status: false, data: e });
  }
});


app.put('/api/settings/:key/:value', function (req, res, next) {
  const key = req.params.key;
  const value = req.params.value;
  format_response(data.settings.put(key, value), res);
});


app.put('/api/test', function (req, res, next) {
  try {
    let result = control.test.execute(req.body);
    res.json(result);
  }
  catch (e) {
    res.json({ status: false, data: e.message });
  }
});

data.settings.init()
  .then(res => {
    server.listen(80, () => {
      console.log('CORS-enabled web server listening on port 80')
    });
  })
  .then(res => {
    io.on('connect', (socket) => {
      control.use(socket);
    });
  });


