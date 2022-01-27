'use strict';
import uuid from 'uuid';
import { logError } from '../../../libs/logger.js';

function onConnect (connection, emitter, user) {
  const hubClientId = user.hubClientId;

  if(emitter.listenerCount(hubClientId) > 0) {
    logError('Already have a hub attached for account');
    return connection.close();
  }

  function onRequest(reqData) {
    const { cb } = reqData;
    const reqId = uuid.v4();
    let cleanupTimeoutId;

    reqData = {
      ...reqData, 
      reqId,
      cb: undefined
    };
    
    function onResponse(message) {
      try {
        const payload = JSON.parse(message.utf8Data);
        if(payload.reqId !== reqId) {
          return; // This message is not for us. Ignore.
        }

        clearTimeout(cleanupTimeoutId);
        connection.removeListener('message', onResponse);

        cb(null, payload);
      } catch(e) {
        logError(`could not parse message ${message.utf8Data}`);
        logError(e);
        return cb(e);
      }
    }

    cleanupTimeoutId = setTimeout(() => {
      connection.removeListener('message', onResponse);
      logError('Request timed out!');
      cb(new Error('ETIMEOUT'));
    }, 5000);

    connection.on('message', onResponse);
    connection.send(JSON.stringify(reqData));
  }

  emitter.on(hubClientId, onRequest);

  // Clean up on websocket close.
  connection.on('close', function() {
    emitter.removeListener(hubClientId, onRequest);
  });
}

export default onConnect;
