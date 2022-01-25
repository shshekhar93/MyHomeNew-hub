const redis = require('redis');
const nconf = require('nconf');

nconf.env().file({ file: 'config/config.json' });
const redisUrl = nconf.get('REDIS_CONNECT_STR');

const client = redis.createClient({
  url: redisUrl,
  legacyMode: true
});

client.once('ready', () => {
  console.log('connected to redis!');
});

client.on('error', () => {
  console.error('Redis connection error.');
});

client.on('end', () => {
  console.log('Redis client disconnected.. Should we restart server?');
});

const connect = async () => await client.connect();
module.exports = {
  client,
  connect
};
