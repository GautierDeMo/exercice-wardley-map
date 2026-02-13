const orderMachine = require('./order.machine');

class OrderService {
  constructor({ prisma, stockService }) {
    this.prisma = prisma;
    this.stockService = stockService;
  }

  async createOrder(cartId) {
    // In a real app, we would fetch cart items and calculate total here
    // For now, we mock the total and items snapshot as per original implementation
    return this.prisma.order.create({
      data: {
        status: orderMachine.initialState.value,
        total: 100.00, // Mocked
        items: []      // Mocked
      }
    });
  }

  async checkout(orderId) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const nextState = orderMachine.transition(order.status, 'CHECKOUT');

    if (!nextState.changed) {
      throw new Error(`Invalid transition from ${order.status} via CHECKOUT`);
    }

    // Trigger Stock Reservation (Side Effect)
    const mockProductId = 'p1';
    const mockQuantity = 1;
    await this.stockService.reserveStock(mockProductId, mockQuantity, orderId);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextState.value }
    });
  }

  async handlePaymentSuccess(orderId) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const nextState = orderMachine.transition(order.status, 'PAYMENT_SUCCESS');

    if (!nextState.changed) {
      // Idempotency: If already Paid, just return success
      if (order.status === 'Paid') return order;
      throw new Error(`Invalid transition from ${order.status} via PAYMENT_SUCCESS`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextState.value }
    });
  }
}

module.exports = OrderService;
