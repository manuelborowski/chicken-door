import express from 'express';
import cors from 'cors';
import path from 'path';
import data from './data.js';
import http from 'http';
import { Server } from 'socket.io';

var app = express()
const server = http.Server(app);
const io = new Server(server);
app.use(cors())

app.use(express.static('public'));
app.use(express.json())

const io = new Server(server);
io.on('connect', (socket) => {
  console.log('server connected');
  socket.emit('main', {door: 'open'});
});


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

// map of valid api keys, typically mapped to
// account info with some sort of database like redis.
// api keys do _not_ serve as authentication, merely to
// track API usage or help prevent malicious behavior etc.
var apiKeys = ['foo', 'bar', 'baz'];

app.get('/api/settings', function (req, res, next) {
  let settings = data.settings.get_all();
  res.json(settings);
});

app.get('/api/settings/:key', function (req, res, next) {
  const key = req.params.key;
  let value = data.settings.get(key);
  res.json(value);
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
  try {
    const key = req.params.key;
    const value = req.params.value;
    data.settings.put(key, value);
    res.json(true);
  }
  catch (e) {
    res.json({ status: false, data: e });
  }
});

app.get('/products/:id', function (req, res, next) {
  res.json({ msg: 'This is CORS-enabled for all origins!' })
})

server.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
