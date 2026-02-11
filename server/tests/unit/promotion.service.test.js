const promotionService = require('../../src/modules/cart/promotion.service');
const { client } = require('../../src/config/redis');

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  client: {
    get: jest.fn(),
    incr: jest.fn()
  }
}));

describe('PromotionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid promotion code', async () => {
    const promo = await promotionService.validatePromotion('WELCOME10');
    expect(promo).toBeDefined();
    expect(promo.value).toBe(10);
  });

  it('should throw error for invalid code', async () => {
    await expect(promotionService.validatePromotion('INVALID'))
      .rejects.toThrow('Invalid promotion code');
  });

  it('should throw error if global limit reached', async () => {
    client.get.mockResolvedValue('100'); // Limit is 100 for WELCOME10
    await expect(promotionService.validatePromotion('WELCOME10'))
      .rejects.toThrow('Promotion limit reached');
  });

  it('should calculate percent discount correctly', () => {
    const promo = { type: 'percent', value: 10 };
    const discount = promotionService.calculateDiscount(100, promo);
    expect(discount).toBe(10);
  });

  it('should calculate flat discount correctly', () => {
    const promo = { type: 'flat', value: 50 };
    const discount = promotionService.calculateDiscount(100, promo);
    expect(discount).toBe(50);
  });
});
