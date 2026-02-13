const OrderService = require('../../src/modules/order/order.service');
const prisma = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  }
}));

describe('OrderService', () => {
  let orderService;
  let mockStockService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStockService = {
      reserveStock: jest.fn()
    };
    orderService = new OrderService({ prisma, stockService: mockStockService });
  });

  it('should create an order', async () => {
    prisma.order.create.mockResolvedValue({ id: 'order-1', status: 'Draft' });
    const order = await orderService.createOrder('cart-1');
    expect(order.status).toBe('Draft');
    expect(prisma.order.create).toHaveBeenCalled();
  });

  it('should checkout successfully', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'Draft' });
    prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'Pending' });

    const result = await orderService.checkout('order-1');

    expect(mockStockService.reserveStock).toHaveBeenCalledWith('p1', 1, 'order-1');
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'Pending' }
    }));
    expect(result.status).toBe('Pending');
  });

  it('should fail checkout if transition invalid', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'Paid' });
    await expect(orderService.checkout('order-1'))
      .rejects.toThrow('Invalid transition');
  });

  it('should handle payment success', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'Pending' });
    prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'Paid' });

    const result = await orderService.handlePaymentSuccess('order-1');
    expect(result.status).toBe('Paid');
  });

  it('should be idempotent for payment success', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'Paid' });
    const result = await orderService.handlePaymentSuccess('order-1');
    expect(result.status).toBe('Paid');
  });
});
