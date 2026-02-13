const prisma = require('./config/db');
const { getChannel } = require('./config/rabbitmq');
const { client: redisClient } = require('./config/redis');
const StockService = require('./modules/stock/stock.service');
const PromotionService = require('./modules/cart/promotion.service');

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

  container.stockService = new StockService(deps);
  container.promotionService = new PromotionService(deps);

  console.log('Dependency Injection Container initialized.');
  return container;
};

module.exports = { container, setupContainer };
