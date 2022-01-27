'use strict';
const WSClient = require('websocket').client;
const request = require('request');
const { logError, logInfo } = require('./libs/logger');

const client = new WSClient({
  keepalive: true,
  useNativeKeepalive: false,
  keepaliveInterval: 5000,
  dropConnectionOnKeepaliveTimeout: true,
  keepaliveGracePeriod: 8000
});

client.on('connectFailed', function(err) {
  logError(err);
  process.exit(1);
});

client.on('connect', function(connection) {
  connection.on('error', function(err) {
    logError('WS Conn error');
    logError(err);
  });

  connection.on('close', function() {
    logInfo('connection closed!');
//    process.exit(1);
    setTimeout(connect, 1000); // delay reconnect by a second.
  });

  connection.on('message', message => {
    if(message.type === 'utf8') {
      try {
        logInfo(`Relaying request: ${message.utf8Data}`);
        const data = JSON.parse(message.utf8Data);
        handleMessage(data, resp => connection.send(JSON.stringify(resp)));
      } catch(e) { logError(e) }
    }
  });
});

let options = {};
process.on('message', message => {
  options = message;
  connect();
});

function connect() {
  if(!options || !options.server || !options.id || !options.secret) {
    logError('options not received yet from parent!');
    return;
  }
  const {
    server, id, secret
  } = options;
  client.connect(server, 'myhomenew', null, { authorization: `${id}:${secret}`});
}

function handleMessage(data, send) {
  request({
    url: `${options.localhost}${data.url}`,
    method: data.method,
    headers: {
      'websocket-proxy-request': options.cpSecret
    },
    body: data.body,
    json: true
  }, function(err, resp, body){
    if(err) {
      logError('WS Proxy request err');
      logError(err);
    }

    const status = (resp && resp.statusCode) || 500;
    
    send({
      status,
      body,
      type: resp.headers['content-type'],
      reqId: data.reqId
    })
  })
}
