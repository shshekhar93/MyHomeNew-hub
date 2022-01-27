const redis = require('redis');
const nconf = require('nconf');
const { logInfo, logError } = require('./logger');

nconf.env().file({ file: 'config/config.json' });
const redisUrl = nconf.get('REDIS_CONNECT_STR');

const client = redis.createClient({
  url: redisUrl,
  legacyMode: true
});

client.once('ready', () => {
  logInfo('Connected to redis!');
});

client.on('error', (err) => {
  logError(`Redis connection error: ${err.message}`);
});

client.on('end', () => {
  logInfo('Redis client disconnected.. Should we restart server?');
});

const connect = async () => await client.connect();
module.exports = {
  client,
  connect
};
