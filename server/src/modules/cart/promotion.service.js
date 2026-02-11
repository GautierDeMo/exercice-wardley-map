const { client } = require('../../config/redis');

const PROMOTIONS = {
  'WELCOME10': { type: 'percent', value: 10, globalLimit: 100 },
  'SUMMER50': { type: 'flat', value: 50, globalLimit: 10 }, // $50 off
  'VIP': { type: 'percent', value: 20, globalLimit: null }
};

class PromotionService {
  async validatePromotion(code) {
    const promo = PROMOTIONS[code];
    if (!promo) {
      throw new Error('Invalid promotion code');
    }

    if (promo.globalLimit) {
      const usage = await client.get(`promo:${code}:usage`);
      if (usage && parseInt(usage) >= promo.globalLimit) {
        throw new Error('Promotion limit reached');
      }
    }

    return promo;
  }

  async incrementUsage(code) {
    const promo = PROMOTIONS[code];
    if (promo && promo.globalLimit) {
      await client.incr(`promo:${code}:usage`);
    }
  }

  calculateDiscount(total, promo) {
    if (promo.type === 'percent') {
      return total * (promo.value / 100);
    } else if (promo.type === 'flat') {
      return Math.min(total, promo.value);
    }
    return 0;
  }
}

module.exports = new PromotionService();
