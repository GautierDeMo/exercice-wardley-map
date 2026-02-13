const CartService = require('../../src/modules/cart/cart.service');
const prisma = require('../../src/config/db');
const { container } = require('../../src/container');

jest.mock('../../src/config/db', () => ({
  cart: { create: jest.fn(), findUnique: jest.fn() },
  cartEvent: { create: jest.fn() }
}));

jest.mock('../../src/container', () => ({
  container: {
    promotionService: {
      validatePromotion: jest.fn(),
      incrementUsage: jest.fn(),
      calculateDiscount: jest.fn()
    }
  }
}));

describe('CartService', () => {
  let cartService;

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService({
      prisma,
      promotionService: container.promotionService
    });
  });

  it('should create a cart', async () => {
    prisma.cart.create.mockResolvedValue({ id: 'cart-1' });
    const cart = await cartService.createCart();
    expect(cart).toEqual({ id: 'cart-1' });
  });

  it('should add item to cart', async () => {
    await cartService.addItem('cart-1', { productId: 'p1', quantity: 1, price: 100 });
    expect(prisma.cartEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'ITEM_ADDED',
        payload: { productId: 'p1', quantity: 1, price: 100 }
      })
    }));
  });

  it('should apply promotion', async () => {
    const mockPromo = { type: 'percent', value: 10 };
    container.promotionService.validatePromotion.mockResolvedValue(mockPromo);
    // Mock getCart to return something to avoid error in return
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', events: [] });

    await cartService.applyPromotion('cart-1', 'WELCOME10');

    expect(container.promotionService.validatePromotion).toHaveBeenCalledWith('WELCOME10');
    expect(prisma.cartEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'PROMO_APPLIED',
        payload: expect.objectContaining({ code: 'WELCOME10' })
      })
    }));
    expect(container.promotionService.incrementUsage).toHaveBeenCalledWith('WELCOME10');
  });
});
