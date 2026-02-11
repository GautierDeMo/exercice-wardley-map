const cartService = require('../../src/modules/cart/cart.service');
const prisma = require('../../src/config/db');

// Mock Prisma
jest.mock('../../src/config/db', () => ({
  cart: {
    create: jest.fn(),
    findUnique: jest.fn()
  },
  cartEvent: {
    create: jest.fn()
  }
}));

describe('CartService (Event Sourcing)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a cart', async () => {
    prisma.cart.create.mockResolvedValue({ id: 'c1' });
    const cart = await cartService.createCart();
    expect(cart.id).toBe('c1');
  });

  it('should add item event', async () => {
    await cartService.addItem('c1', { productId: 'p1', quantity: 1, price: 10 });
    expect(prisma.cartEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'ITEM_ADDED',
        payload: { productId: 'p1', quantity: 1, price: 10 }
      })
    }));
  });

  it('should replay events to calculate state', async () => {
    const mockEvents = [
      { type: 'ITEM_ADDED', payload: { productId: 'p1', quantity: 1, price: 10 } },
      { type: 'ITEM_ADDED', payload: { productId: 'p1', quantity: 2, price: 10 } }, // Add more of same
      { type: 'ITEM_ADDED', payload: { productId: 'p2', quantity: 1, price: 20 } }
    ];

    prisma.cart.findUnique.mockResolvedValue({ id: 'c1', events: mockEvents });

    const cart = await cartService.getCart('c1');
    expect(cart.items).toHaveLength(2); // p1 and p2
    expect(cart.items.find(i => i.productId === 'p1').quantity).toBe(3); // 1 + 2
    expect(cart.total).toBe(50); // (3 * 10) + (1 * 20)
  });
});
