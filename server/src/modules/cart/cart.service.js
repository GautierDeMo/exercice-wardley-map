const prisma = require('../../config/db');

class CartService {
  async createCart() {
    return prisma.cart.create({ data: {} });
  }

  async addItem(cartId, { productId, quantity, price }) {
    // In a real app, we would verify product existence and price here.
    // For Event Sourcing, we snapshot the price at the time of addition.
    return prisma.cartEvent.create({
      data: {
        cartId,
        type: 'ITEM_ADDED',
        payload: { productId, quantity, price }
      }
    });
  }

  async getCart(cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { events: { orderBy: { createdAt: 'asc' } } }
    });

    if (!cart) return null;

    // --- Event Replay & State Reconstruction ---
    const state = {
      items: [],
      total: 0
    };

    for (const event of cart.events) {
      if (event.type === 'ITEM_ADDED') {
        const { productId, quantity, price } = event.payload;
        const existingItem = state.items.find(i => i.productId === productId);

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({ productId, quantity, price });
        }
      }
      // Future: Handle 'ITEM_REMOVED', 'PROMO_APPLIED'
    }

    // Calculate Total
    state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return { id: cartId, ...state };
  }
}

module.exports = new CartService();
