const PromotionService = require('../../src/modules/cart/promotion.service');

describe('PromotionService', () => {
  let promotionService;
  let mockRedis;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      incr: jest.fn()
    };
    promotionService = new PromotionService({ redisClient: mockRedis });
  });

  it('should validate a valid code', async () => {
    const promo = await promotionService.validatePromotion('WELCOME10');
    expect(promo).toBeDefined();
    expect(promo.value).toBe(10);
  });

  it('should throw on invalid code', async () => {
    await expect(promotionService.validatePromotion('INVALID'))
      .rejects.toThrow('Invalid promotion code');
  });

  it('should check global limit', async () => {
    mockRedis.get.mockResolvedValue('100'); // Limit is 100
    await expect(promotionService.validatePromotion('WELCOME10'))
      .rejects.toThrow('Promotion limit reached');
    expect(mockRedis.get).toHaveBeenCalledWith('promo:WELCOME10:usage');
  });

  it('should increment usage', async () => {
    await promotionService.incrementUsage('WELCOME10');
    expect(mockRedis.incr).toHaveBeenCalledWith('promo:WELCOME10:usage');
  });

  it('should calculate discount', () => {
    const promo = { type: 'percent', value: 10 };
    const discount = promotionService.calculateDiscount(100, promo);
    expect(discount).toBe(10);
  });
});
