const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { connectRabbitMQ, closeRabbitMQ } = require('../../src/config/rabbitmq');
const { connectRedis, disconnectRedis } = require('../../src/config/redis');
const { setupContainer, container } = require('../../src/container');

describe('Worker Lifecycle Integration', () => {
  let outboxInterval;

  beforeAll(async () => {
    await connectRabbitMQ();
    await connectRedis();
    setupContainer(); // Initialize DI container

    // Force delay to 1s for tests to ensure reliability regardless of NODE_ENV
    container.outboxWorker.delay = 1000;

    await container.expirationWorker.start();
    outboxInterval = setInterval(() => container.outboxWorker.process(), 500); // Poll every 500ms

    // Clean DB
    await prisma.outbox.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.product.deleteMany();

    // Seed product
    await prisma.product.create({
      data: {
        id: 'p1',
        title: 'Test Product',
        price: 100,
        stock: { create: { quantity: 10, version: 0 } }
      }
    });
  });

  afterAll(async () => {
    clearInterval(outboxInterval);
    await closeRabbitMQ();
    await disconnectRedis();
    await prisma.$disconnect();
  });

  it('should handle full flow: Checkout -> Outbox -> Expiration -> Release', async () => {
    // 1. Create Order
    const createRes = await request(app).post('/api/orders').send({ cartId: 'cart-1' });
    const orderId = createRes.body.id;

    // 2. Checkout (Reserves Stock + Creates Outbox Event)
    const checkoutRes = await request(app).post(`/api/orders/${orderId}/checkout`);
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.status).toBe('Pending');

    // Verify Stock Reserved
    const stock = await prisma.stock.findUnique({ where: { productId: 'p1' } });
    expect(stock.quantity).toBe(9); // 10 - 1

    // 3. Wait for Expiration (Worker should process Outbox -> RabbitMQ -> Delay -> Expiration Worker)
    await new Promise(resolve => setTimeout(resolve, 4000));

    // 4. Verify Order Expired and Stock Released
    const expiredOrder = await prisma.order.findUnique({ where: { id: orderId } });
    expect(expiredOrder.status).toBe('Expired');

    const releasedStock = await prisma.stock.findUnique({ where: { productId: 'p1' } });
    expect(releasedStock.quantity).toBe(10); // Back to initial
  }, 10000);
});
