const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');
const { connectRabbitMQ, closeRabbitMQ } = require('../../src/config/rabbitmq');
const { processOutbox } = require('../../src/workers/outbox.worker');
const { startExpirationWorker } = require('../../src/workers/expiration.worker');

describe('Worker Lifecycle Integration', () => {
  let productId = 'p1';
  let orderId;

  beforeAll(async () => {
    await connectRabbitMQ();
    await startExpirationWorker();

    // Setup Data
    await prisma.outbox.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.product.deleteMany();

    await prisma.product.create({
      data: {
        id: productId,
        title: 'Test Product',
        price: 100,
        stock: { create: { quantity: 10, version: 0 } }
      }
    });
  });

  afterAll(async () => {
    await closeRabbitMQ();
    await prisma.$disconnect();
  });

  it('should handle full flow: Checkout -> Outbox -> Expiration -> Release', async () => {
    // 1. Create Order
    const createRes = await request(app).post('/api/orders').send({ cartId: 'c1' });
    orderId = createRes.body.id;

    // 2. Checkout (Reserves Stock + Creates Outbox Event)
    const checkoutRes = await request(app).post(`/api/orders/${orderId}/checkout`);
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.status).toBe('Pending');

    // Verify Stock Reserved
    const stockAfterReserve = await prisma.stock.findUnique({ where: { productId } });
    expect(stockAfterReserve.quantity).toBe(9);

    // Verify Outbox Event created
    const events = await prisma.outbox.findMany({ where: { aggregateId: orderId } });
    expect(events).toHaveLength(1);
    expect(events[0].published).toBe(false);

    // 3. Run Outbox Worker (Publish to RabbitMQ)
    await processOutbox();

    // Verify Event marked as published
    const publishedEvents = await prisma.outbox.findMany({ where: { aggregateId: orderId } });
    expect(publishedEvents[0].published).toBe(true);

    // 4. Wait for Expiration (RabbitMQ Delay is 2s in worker)
    // We wait 3s to be safe
    await new Promise(r => setTimeout(r, 3000));

    // 5. Verify Order is Expired
    const expiredOrder = await prisma.order.findUnique({ where: { id: orderId } });
    expect(expiredOrder.status).toBe('Expired');

    // 6. Verify Stock Released
    const stockAfterRelease = await prisma.stock.findUnique({ where: { productId } });
    expect(stockAfterRelease.quantity).toBe(10);

  }, 10000); // Increase timeout for delay
});
