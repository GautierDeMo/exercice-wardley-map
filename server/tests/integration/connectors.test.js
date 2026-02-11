const { connectRedis, disconnectRedis } = require('../../src/config/redis');
const { connectRabbitMQ, closeRabbitMQ } = require('../../src/config/rabbitmq');
const prisma = require('../../src/config/db');

describe('Connectors Integration', () => {
  afterAll(async () => {
    await disconnectRedis();
    await closeRabbitMQ();
    await prisma.$disconnect();
  });

  test('Redis should connect and set/get a value', async () => {
    const client = await connectRedis();
    await client.set('test_key', 'hello');
    const value = await client.get('test_key');
    expect(value).toBe('hello');
    await client.del('test_key');
  });

  test('RabbitMQ should connect and assert delayed exchange', async () => {
    const { channel } = await connectRabbitMQ();
    expect(channel).toBeDefined();

    // Verify exchange exists by checking it doesn't throw
    await expect(channel.checkExchange('delayed_exchange')).resolves.not.toThrow();
  });

  test('Prisma should be able to query the database', async () => {
    // Simple query to check connection
    const count = await prisma.product.count();
    expect(typeof count).toBe('number');
  });
});
