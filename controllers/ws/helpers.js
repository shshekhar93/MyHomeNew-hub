import { encrypt, decrypt } from '../../libs/crypto.js';

const JSON_TYPE = 'application/json';

function sendMessageToDevice(conn, obj, key, decryptionKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(obj);
    const encryptedPayload = encrypt(payload, key);

    function onMsg(message) {
      clearTimeout(cleanupTimeoutId);
      try {
        const resp = JSON.parse(
          decrypt(message.utf8Data, decryptionKey || key)
        );
        if (resp.status === 'OK') {
          return resolve(resp);
        }
        return reject(new Error('DEV_REPORTED_ERR'));
      } catch (e) {
        return reject(new Error('COULDNT_PARSE_MSG'));
      }
    }

    function cleanup(shouldReject = true) {
      conn.removeListener('message', onMsg);
      if (shouldReject) {
        return reject(new Error('WS_WAIT_TIMEOUT'));
      }
    }

    const cleanupTimeoutId = setTimeout(cleanup, 5000);
    conn.once('message', onMsg);
    conn.send(encryptedPayload);
  });
}

function createProxyMiddleware(emitter) {
  return (req, res) => {
    const hubClientId =
      _get(req, 'user.hubClientId') ||
      _get(res, 'locals.oauth.token.user.hubClientId');

    if (emitter.listenerCount(hubClientId) === 0) {
      // We should at least retry once, after a second or so!!
      return res.status(503).json({
        success: false,
        err: 'Service unavailable',
      }); // Server is unavailable.
    }

    emitter.emit(hubClientId, {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      type: req.get('content-type'),
      cb: (err, resp) => {
        if (err) {
          return res.status(500).json({
            success: false,
            err: 'Something went wrong',
          });
        }
        const respPayload =
          typeof resp.body !== 'string' ? JSON.stringify(resp.body) : resp.body;
        res
          .status(resp.status || 200)
          .type(req.type || JSON_TYPE)
          .end(respPayload);
      },
    });
  };
}

export { sendMessageToDevice, createProxyMiddleware };
