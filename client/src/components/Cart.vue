<script setup>
import { ref, watch } from 'vue';
import api from '../services/api';

const props = defineProps({
  cartId: String
});

const cart = ref(null);
const orderStatus = ref(null);
const promoCode = ref('');
const promoMessage = ref('');
const isCheckingOut = ref(false);

const fetchCart = async () => {
  if (!props.cartId) return;
  try {
    const res = await api.getCart(props.cartId);
    cart.value = res.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
  }
};

// Expose fetchCart to parent
defineExpose({ fetchCart });

watch(() => props.cartId, fetchCart, { immediate: true });

const applyPromo = async () => {
  if (!props.cartId || !promoCode.value) return;
  try {
    const res = await api.applyPromotion(props.cartId, promoCode.value);
    cart.value = res.data;
    promoMessage.value = 'Promotion applied!';
  } catch (error) {
    console.error('Promo failed:', error);
    promoMessage.value = 'Invalid Code: ' + (error.response?.data?.error || error.message);
  }
};

const checkout = async () => {
  if (!cart.value) return;
  isCheckingOut.value = true;
  try {
    // 1. Create Order
    const orderRes = await api.createOrder(props.cartId);
    const orderId = orderRes.data.id;
    orderStatus.value = `Order Created (${orderId})...`;

    // 2. Checkout (Reserve Stock)
    const checkoutRes = await api.checkout(orderId);
    orderStatus.value = `Success! Status: ${checkoutRes.data.status}`;

    // Refresh cart (should be empty or handled logic)
    // In this event sourcing model, the cart doesn't automatically empty unless we implement it.
  } catch (error) {
    console.error('Checkout failed:', error);
    orderStatus.value = 'Failed: ' + (error.response?.data?.error || error.message);
  } finally {
    isCheckingOut.value = false;
  }
};
</script>

<template>
  <div class="cart-card">
    <div class="cart-header">
      <h2>Your Cart</h2>
    </div>

    <div v-if="cart" class="cart-content">
      <div v-if="cart.items.length === 0" class="empty-cart">
        Your cart is empty
      </div>

      <div v-else class="cart-items">
        <div v-for="(item, index) in cart.items" :key="index" class="cart-item">
          <div class="item-details">
            <span class="item-name">Product {{ item.productId }}</span>
            <span class="item-qty">x{{ item.quantity }}</span>
          </div>
          <span class="item-price">${{ item.price }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="promo-section">
        <div class="input-group">
          <input
            v-model="promoCode"
            placeholder="Promo Code"
            @keyup.enter="applyPromo"
          />
          <button @click="applyPromo" class="text-btn">Apply</button>
        </div>
        <p v-if="promoMessage" class="message" :class="{ error: promoMessage.includes('Invalid') }">
          {{ promoMessage }}
        </p>
      </div>

      <div class="divider"></div>

      <div class="totals">
        <div v-if="cart.discount > 0" class="total-row discount">
          <span>Discount</span>
          <span>-${{ cart.discount }}</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>${{ cart.finalTotal ?? cart.total }}</span>
        </div>
      </div>

      <button
        @click="checkout"
        :disabled="cart.items.length === 0 || isCheckingOut"
        class="checkout-btn"
      >
        {{ isCheckingOut ? 'Processing...' : 'Checkout' }}
      </button>

      <div v-if="orderStatus" class="status-message">
        {{ orderStatus }}
      </div>
    </div>
    <div v-else class="loading">Loading cart...</div>
  </div>
</template>

<style scoped>
.cart-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 24px;
  position: sticky;
  top: 100px;
}

.cart-header h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 600;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
}

.item-details {
  display: flex;
  gap: 8px;
  color: var(--text-main);
}

.item-qty {
  color: var(--text-light);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 20px 0;
}

.promo-section {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  border: 1px solid var(--text-light);
  border-radius: 8px;
  overflow: hidden;
  padding: 4px;
}

.input-group:focus-within {
  border-color: var(--text-main);
  outline: 1px solid var(--text-main);
}

.input-group input {
  border: none;
  padding: 8px 12px;
  flex: 1;
  outline: none;
  font-size: 14px;
}

.text-btn {
  background: transparent;
  color: var(--text-main);
  font-weight: 600;
  font-size: 14px;
  padding: 0 12px;
  text-decoration: underline;
}

.message {
  font-size: 12px;
  margin-top: 8px;
  color: #008a05;
}

.message.error {
  color: #c13515;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: var(--text-main);
}

.total-row.discount {
  color: #008a05;
}

.total-row.final {
  font-weight: 800;
  font-size: 18px;
}

.checkout-btn {
  width: 100%;
  background: linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%);
  color: white;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ddd;
}

.checkout-btn:not(:disabled):hover {
  background: linear-gradient(to right, #D9324E 0%, #D9324E 100%);
}

.status-message {
  font-size: 14px;
  text-align: center;
  color: var(--text-light);
  margin-top: 12px;
  padding: 8px;
  background: #f7f7f7;
  border-radius: 6px;
}

.empty-cart {
  color: var(--text-light);
  text-align: center;
  padding: 20px 0;
}
</style>
