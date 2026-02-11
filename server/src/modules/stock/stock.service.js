const prisma = require('../../config/db');

class StockService {
  async getStock(productId) {
    return prisma.stock.findUnique({
      where: { productId }
    });
  }

  /**
   * Reserves stock using Optimistic Locking.
   * It checks the version during the update to ensure atomicity.
   */
  async reserveStock(productId, quantity) {
    // 1. Fetch current state (Version & Quantity)
    const stock = await prisma.stock.findUnique({
      where: { productId }
    });

    if (!stock) {
      throw new Error('Product not found');
    }

    if (stock.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // 2. Attempt atomic update
    // We use updateMany because 'version' is not a unique identifier,
    // but we need it in the WHERE clause for optimistic locking.
    const { count } = await prisma.stock.updateMany({
      where: {
        productId: productId,
        version: stock.version, // Optimistic Lock Check
        quantity: { gte: quantity } // Double check constraint
      },
      data: {
        quantity: { decrement: quantity },
        version: { increment: 1 }
      }
    });

    if (count === 0) {
      throw new Error('Concurrency conflict: Stock was modified by another transaction. Please retry.');
    }

    return { success: true, productId, reserved: quantity, newVersion: stock.version + 1 };
  }

  async releaseStock(productId, quantity) {
    return prisma.stock.update({
      where: { productId },
      data: {
        quantity: { increment: quantity },
        version: { increment: 1 }
      }
    });
  }
}

module.exports = new StockService();
