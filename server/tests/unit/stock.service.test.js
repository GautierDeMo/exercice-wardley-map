const stockService = require('../../src/modules/stock/stock.service');
const prisma = require('../../src/config/db');

// Mock Prisma
jest.mock('../../src/config/db', () => {
  const mockStock = {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn()
  };
  const mockOutbox = {
    create: jest.fn()
  };

  return {
    stock: mockStock,
    outbox: mockOutbox,
    $transaction: jest.fn((callback) => callback({
      stock: mockStock,
      outbox: mockOutbox
    }))
  };
});

describe('StockService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reserve stock successfully when version matches', async () => {
    prisma.stock.findUnique.mockResolvedValue({ productId: 'p1', quantity: 10, version: 1 });
    prisma.stock.updateMany.mockResolvedValue({ count: 1 }); // Success

    const result = await stockService.reserveStock('p1', 2);

    expect(result.success).toBe(true);
    expect(prisma.stock.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ version: 1 })
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

    // Should not attempt update
    expect(prisma.stock.updateMany).not.toHaveBeenCalled();
  });
});
