import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  // Stock
  getStock(productId) {
    return api.get(`/stock/${productId}`);
  },

  // Cart
  createCart() {
    return api.post('/cart');
  },
  getCart(cartId) {
    return api.get(`/cart/${cartId}`);
  },
  addItemToCart(cartId, { productId, quantity, price }) {
    return api.post(`/cart/${cartId}/items`, { productId, quantity, price });
  },
  applyPromotion(cartId, code) {
    return api.post(`/cart/${cartId}/promo`, { code });
  },

  // Order
  createOrder(cartId) {
    return api.post('/orders', { cartId });
  },
  checkout(orderId) {
    return api.post(`/orders/${orderId}/checkout`);
  }
};
