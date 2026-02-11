const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Prisma Schema Integration', () => {
  beforeAll(async () => {
    // Clean up potentially existing data
    await prisma.stock.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a product with stock and versioning', async () => {
    const product = await prisma.product.create({
      data: {
        title: 'Test Product',
        price: 10.99,
        stock: {
          create: {
            quantity: 100,
            version: 0
          }
        }
      },
      include: { stock: true }
    });

    expect(product.id).toBeDefined();
    expect(product.stock.quantity).toBe(100);
    expect(product.stock.version).toBe(0);
  });
});
