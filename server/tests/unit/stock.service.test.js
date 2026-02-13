const StockService = require('../../src/modules/stock/stock.service');
const prisma = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  stock: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  outbox: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(require('../../src/config/db'))),
}));

describe('StockService', () => {
  let stockService;

  beforeEach(() => {
    jest.clearAllMocks();
    stockService = new StockService({ prisma });
  });

  it('should reserve stock successfully when version matches', async () => {
    prisma.stock.findUnique.mockResolvedValue({ productId: 'p1', quantity: 10, version: 1 });
    prisma.stock.updateMany.mockResolvedValue({ count: 1 }); // Success

    const result = await stockService.reserveStock('p1', 2, 'order-1');

    expect(result.success).toBe(true);
    expect(prisma.stock.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { productId: 'p1', version: 1, quantity: { gte: 2 } },
      data: { quantity: { decrement: 2 }, version: { increment: 1 } }
    }));
  });

  it('should throw error on concurrency conflict (version mismatch)', async () => {
    prisma.stock.findUnique.mockResolvedValue({ productId: 'p1', quantity: 10, version: 1 });
    prisma.stock.updateMany.mockResolvedValue({ count: 0 }); // Fail (DB version changed)

    await expect(stockService.reserveStock('p1', 2))
      .rejects.toThrow('Concurrency conflict');
  });

  it('should throw error if insufficient stock', async () => {
    prisma.stock.findUnique.mockResolvedValue({ productId: 'p1', quantity: 1, version: 1 });

    await expect(stockService.reserveStock('p1', 2))
      .rejects.toThrow('Insufficient stock');
  });
});
