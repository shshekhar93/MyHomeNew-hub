'use strict';
import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import type { connection as WebsocketConnection } from 'websocket';
import _omit from 'lodash/omit.js';
import { logInfo, logError } from '../../libs/logger.js';
import type { UserT } from '../../models/users.js';

export type RequestT = {
  cb: (err: Error | null, resp?: unknown) => void;
  [key: string]: unknown;
};

async function onConnect(connection: WebsocketConnection, emitter: EventEmitter, user: UserT) {
  const hubClientId = user.hubClientId;

  if (emitter.listenerCount(hubClientId) > 0) {
    logError('Already have a hub attached for account');
    throw new Error('HUB_ALREADY_CONNECTED');
  }

  function onRequest(reqData: RequestT) {
    const { cb } = reqData;
    const reqId = uuid();

    const reqDataWithId = { ..._omit(reqData, 'cb'), reqId };

    function onResponse(message: { utf8Data: string }) {
      try {
        const payload = JSON.parse(message.utf8Data);
        if (payload.reqId !== reqId) {
          return; // This message is not for us. Ignore.
        }

        clearTimeout(cleanupTimeoutId);
        connection.removeListener('message', onResponse);

        cb(null, payload);
      }
      catch (e) {
        logError(`could not parse message ${message.utf8Data}`);
        logError(e);
        return cb(e as Error);
      }
    }

    const cleanupTimeoutId = setTimeout(() => {
      connection.removeListener('message', onResponse);
      logError('Request timed out!');
      cb(new Error('ETIMEOUT'));
    }, 5000);

    // @ts-expect-error - it does exist though
    connection.on('message', onResponse);
    connection.send(JSON.stringify(reqDataWithId));
  }

  emitter.on(hubClientId, onRequest);

  // Clean up on websocket close.
  connection.on('close', function () {
    logInfo('Cleaned up listener for ' + hubClientId);
    emitter.removeListener(hubClientId, onRequest);
  });

  connection.on('error', function () {
    logError('Connection error ' + hubClientId);
    connection.close();
  });
}

export { onConnect };
