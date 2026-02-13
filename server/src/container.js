const prisma = require('./config/db');
const { getChannel } = require('./config/rabbitmq');
const { client: redisClient } = require('./config/redis');

// Container object to hold instances
const container = {};

/**
 * Initialize the container with dependencies.
 * This should be called after infrastructure connections are established.
 */
const setupContainer = () => {
  // Infrastructure dependencies
  const deps = {
    prisma,
    getChannel,
    redisClient
  };

  // Services will be instantiated here in future steps
  // e.g., container.stockService = new StockService(deps);

  console.log('Dependency Injection Container initialized.');
  return container;
};

module.exports = { container, setupContainer };
