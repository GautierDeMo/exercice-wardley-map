<script setup>
import { ref, watch, onUnmounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  cartId: String
});

const cart = ref(null);
const orderStatus = ref(null);
const promoCode = ref('');
const promoMessage = ref('');
const isCheckingOut = ref(false);
const currentOrderId = ref(null);
const timeLeft = ref(0);
const notification = ref('');
let timer = null;

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

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

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
  notification.value = '';
  currentOrderId.value = null;

  try {
    // 1. Create Order
    const orderRes = await api.createOrder(props.cartId);
    const orderId = orderRes.data.id;
    currentOrderId.value = orderId;
    orderStatus.value = `Order Created (${orderId})...`;

    // 2. Checkout (Reserve Stock)
    const checkoutRes = await api.checkout(orderId);
    orderStatus.value = `Success! Status: ${checkoutRes.data.status}`;

    // Start Timer (15 seconds based on backend worker)
    timeLeft.value = 15;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (timeLeft.value > 0) timeLeft.value--;
      else clearInterval(timer);
    }, 1000);

    // Refresh cart (should be empty or handled logic)
    // In this event sourcing model, the cart doesn't automatically empty unless we implement it.
  } catch (error) {
    console.error('Checkout failed:', error);
    orderStatus.value = 'Failed: ' + (error.response?.data?.error || error.message);
  } finally {
    isCheckingOut.value = false;
  }
};

const removeItem = async (productId) => {
  if (!props.cartId) return;
  try {
    const res = await fetch(`/api/cart/${props.cartId}/items/${productId}`, {
      method: 'DELETE'
    });
    const updatedCart = await res.json();
    cart.value = updatedCart;
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

const simulatePayment = async () => {
  if (!currentOrderId.value) return;
  try {
    const res = await fetch(`/api/orders/${currentOrderId.value}/payment-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    });
    const data = await res.json();

    if (data.status === 'Paid') {
      orderStatus.value = `Status: ${data.status}`;
      notification.value = "Order paid, shipping scheduled at your home in 3 days";
      if (timer) clearInterval(timer);
      timeLeft.value = 0;
    } else if (data.status === 'Conflict') {
      orderStatus.value = `Status: ${data.status}`;
      notification.value = "Order expired. Payment received. Refund initiated.";
    } else {
      orderStatus.value = `Status: ${data.status}`;
    }
  } catch (error) {
    console.error('Payment simulation failed', error);
    notification.value = "Payment simulation failed";
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
          <div class="item-actions">
            <span class="item-price">${{ item.price }}</span>
            <button @click="removeItem(item.productId)" class="remove-btn" :disabled="isCheckingOut">×</button>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="promo-section">
        <div class="input-group">
          <input
            v-model="promoCode"
            placeholder="Promo Code (Try WELCOME10)"
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

      <div v-if="timeLeft > 0" class="timer-display">
        Stock reserved for: {{ timeLeft }}s<br>
        <small>(Conflict if paid after)</small>
      </div>

      <button
        v-if="currentOrderId"
        @click="simulatePayment"
        class="pay-btn"
      >
        Simulate Payment
      </button>

      <div v-if="orderStatus" class="status-message">
        {{ orderStatus }}
      </div>
    </div>
    <div v-else class="loading">Loading cart...</div>
  </div>

  <div v-if="notification" class="notification-toast">
    {{ notification }}
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

.item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 20px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}

.remove-btn:hover {
  color: var(--primary);
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

.pay-btn {
  width: 100%;
  background: #222;
  color: white;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.timer-display {
  text-align: center;
  color: #E61E4D;
  font-weight: bold;
  margin-bottom: 12px;
}

.notification-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #222;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
