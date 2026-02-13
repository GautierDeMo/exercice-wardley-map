class CartService {
  constructor({ prisma, promotionService }) {
    this.prisma = prisma;
    this.promotionService = promotionService;
  }

  async createCart() {
    return this.prisma.cart.create({ data: {} });
  }

  async addItem(cartId, { productId, quantity, price }) {
    // In a real app, we would verify product existence and price here.
    // For Event Sourcing, we snapshot the price at the time of addition.
    return this.prisma.cartEvent.create({
      data: {
        cartId,
        type: 'ITEM_ADDED',
        payload: { productId, quantity, price }
      }
    });
  }

  async removeItem(cartId, productId) {
    return this.prisma.cartEvent.create({
      data: {
        cartId,
        type: 'ITEM_REMOVED',
        payload: { productId }
      }
    });
  }

  async applyPromotion(cartId, code) {
    // 1. Validate Promo
    const promo = await this.promotionService.validatePromotion(code);

    // 2. Store Event
    await this.prisma.cartEvent.create({
      data: {
        cartId,
        type: 'PROMO_APPLIED',
        payload: { code, ...promo }
      }
    });

    // 3. Increment Global Usage (Side Effect)
    await this.promotionService.incrementUsage(code);

    return this.getCart(cartId);
  }

  async getCart(cartId) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { events: { orderBy: { createdAt: 'asc' } } }
    });

    if (!cart) return null;

    // --- Event Replay & State Reconstruction ---
    const state = {
      items: [],
      total: 0,
      discount: 0,
      finalTotal: 0,
      appliedPromo: null
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
      } else if (event.type === 'ITEM_REMOVED') {
        state.items = state.items.filter(i => i.productId !== event.payload.productId);
      } else if (event.type === 'PROMO_APPLIED') {
        state.appliedPromo = event.payload;
      }
    }

    // Calculate Total
    state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate Discount
    if (state.appliedPromo) {
      state.discount = this.promotionService.calculateDiscount(state.total, state.appliedPromo);
    }

    state.finalTotal = Math.max(0, state.total - state.discount);

    return { id: cartId, ...state };
  }
}

module.exports = CartService;
