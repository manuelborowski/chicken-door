import express from 'express';
import cors from 'cors';
import path from 'path';
import data from './data.js';
import { Control } from './control.js';
import http from 'http';
import { Server } from 'socket.io';
import logger from './logger.js';
import minimist from 'minimist';
import {secret} from '../secret.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
app.use(cors())
app.use(express.static('public'));
app.use(express.json())

const server = http.Server(app);
const io = new Server(server);

let argv = minimist(process.argv.slice(2));
const dont_use_gpio =  ('nogpio' in argv);

const control = new Control(dont_use_gpio);

logger.info('Starting chicken door');

//Limit the debug information in the browser
Error.stackTraceLimit = 0
function error(status, msg) {
  const err = new Error(msg);
  err.status = status;
  return err;
}

app.use('/', function (req, res, next) {
  const key = req.query['api-key'];
  if (!key) return next(error(400, 'no access'));
  if (!~apiKeys.indexOf(key)) return next(error(401, 'no access'));
  req.key = key;
  next();
});

const apiKeys = [secret.api_key];

const format_response = (promise, res) => {
  promise
    .then(value => res.json({ status: true, value }))
    .catch(e => res.json({ status: false, message: e.message }));
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/chicken-door.html'));
});

app.get('/api/settings', function (req, res, next) {
  format_response(data.settings.get_all(), res);
});

app.get('/api/settings/:key', function (req, res, next) {
  const key = req.params.key;
  format_response(data.settings.get(key), res);
});

app.put('/api/batch/settings', function (req, res, next) {
  format_response(data.settings.update_all(req.body), res);
});

app.put('/api/settings/:key/:value', function (req, res, next) {
  const key = req.params.key;
  const value = req.params.value;
  format_response(data.settings.put(key, value), res);
});

app.put('/api/test', function (req, res, next) {
  format_response(control.test.execute(req.body), res);
});

app.get('/api/info/:key', function (req, res, next) {
  const key = req.params.key;
  format_response(data.info.get(key), res);
});

data.init()
  .then(res => server.listen(5000, () => logger.info('CORS-enabled web server listening on port 5000')))
  .then(res => {
    control.init(io);
    io.on('connect', socket => control.use_socket(socket));
  })
  .catch(e => {
    logger.error(`Program abort, error: ${e.message}`);
    console.log(`Program abort, error: ${e.message}\n${e.stack}`);
  });


