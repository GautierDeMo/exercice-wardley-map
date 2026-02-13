const prisma = require('./config/db');
const { getChannel } = require('./config/rabbitmq');
const { client: redisClient } = require('./config/redis');
const StockService = require('./modules/stock/stock.service');
const PromotionService = require('./modules/cart/promotion.service');
const CartService = require('./modules/cart/cart.service');
const OrderService = require('./modules/order/order.service');
const EmailService = require('./modules/notification/email.service');
const OutboxWorker = require('./workers/outbox.worker');
const ExpirationWorker = require('./workers/expiration.worker');

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
  container.cartService = new CartService({ ...deps, promotionService: container.promotionService });
  container.orderService = new OrderService({ ...deps, stockService: container.stockService });
  container.emailService = new EmailService();
  container.outboxWorker = new OutboxWorker(deps);
  container.expirationWorker = new ExpirationWorker({
    ...deps,
    stockService: container.stockService,
    emailService: container.emailService
  });

  console.log('Dependency Injection Container initialized.');
  return container;
};

module.exports = { container, setupContainer };
