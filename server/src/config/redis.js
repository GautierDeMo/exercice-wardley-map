const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
};

const disconnectRedis = async () => {
  if (client.isOpen) {
    await client.disconnect();
  }
};

module.exports = { client, connectRedis, disconnectRedis };
