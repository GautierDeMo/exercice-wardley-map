class StockService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async getStock(productId) {
    return this.prisma.stock.findUnique({
      where: { productId }
    });
  }

  /**
   * Reserves stock using Optimistic Locking.
   * It checks the version during the update to ensure atomicity.
   * Now wraps the update and Outbox event creation in a transaction.
   */
  async reserveStock(productId, quantity, orderId = null) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current state (Version & Quantity)
      const stock = await tx.stock.findUnique({
        where: { productId }
      });

      if (!stock) {
        throw new Error('Product not found');
      }

      if (stock.quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      // 2. Attempt atomic update
      const { count } = await tx.stock.updateMany({
        where: {
          productId: productId,
          version: stock.version,
          quantity: { gte: quantity }
        },
        data: {
          quantity: { decrement: quantity },
          version: { increment: 1 }
        }
      });

      if (count === 0) {
        throw new Error('Concurrency conflict: Stock was modified by another transaction. Please retry.');
      }

      // 3. Create Outbox Event for Expiration
      if (orderId) {
        await tx.outbox.create({
          data: {
            aggregateId: orderId,
            type: 'STOCK_RESERVED',
            payload: { productId, quantity, orderId }
          }
        });
      }

      return { success: true, productId, reserved: quantity, newVersion: stock.version + 1 };
    });
  }

  async releaseStock(productId, quantity) {
    return this.prisma.stock.update({
      where: { productId },
      data: {
        quantity: { increment: quantity },
        version: { increment: 1 }
      }
    });
  }
}

module.exports = StockService;
