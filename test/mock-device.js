const crypto = require('crypto');
const WebSocketClient = require('websocket').client;
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = q => (new Promise(resolve => rl.question(q, resolve)));

function ensureEntryValid(entry) {
  if(!entry) {
    throw new Error('required field');
  }
  return true;
}

Promise.resolve({})
  .then(ctx => {
    return question('Name of device: ')
      .then(name => ensureEntryValid(name) && ({...ctx, name }));
  })
  .then(ctx => {
    return question('Host url: ')
      .then(host => ensureEntryValid(host) && ({...ctx, host}));
  })
  .then(ctx => {
    return question('One time key: ')
      .then(otk => ensureEntryValid(otk) && ({...ctx, otk}));
  })
  .then(ctx => {
    return question('Site username: ')
      .then(username => ensureEntryValid(username) && ({...ctx, username}));
  })
  .then(ctx => {
    console.log('does this look okay:\n', JSON.stringify(ctx, null, 2));
    return question('(Y/n)? ')
      .then(okay => {
        if((okay || '').startsWith('y')) {
          return ctx;
        }
        throw new Error('Process interrupted.');
      })
  })
  .then(ctx => {
    const secret = Buffer.from(ctx.otk, 'hex');
    const IV = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(secret), IV);
    let encrypted = cipher.update(ctx.name);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
      ...ctx,
      password: IV.toString('hex') + '-' + encrypted.toString('hex')
    };
  })
  .then(ctx => {
    const wsClient = new WebSocketClient();
    wsClient.on('connect', connection => {
      console.log('connected');
    });

    wsClient.on('connectFailed', err => {
      console.log('connection failed', err.stack || err);
    });

    wsClient.connect(
      `ws://${ctx.host}/setup`,
      'myhomenew-device',
      null,
      {
        authorization: `${ctx.username}:${ctx.password}`
      });
  })
  .catch(err => console.log(err.stack || err));