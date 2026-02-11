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
  try {
    // 1. Create Order
    const orderRes = await api.createOrder(props.cartId);
    const orderId = orderRes.data.id;
    orderStatus.value = `Order Created (${orderId})...`;

    // 2. Checkout (Reserve Stock)
    const checkoutRes = await api.checkout(orderId);
    orderStatus.value = `Checkout Successful! Status: ${checkoutRes.data.status}`;

    // Refresh cart (should be empty or handled logic)
    // In this event sourcing model, the cart doesn't automatically empty unless we implement it.
  } catch (error) {
    console.error('Checkout failed:', error);
    orderStatus.value = 'Checkout Failed: ' + (error.response?.data?.error || error.message);
  }
};
</script>

<template>
  <div class="cart">
    <h2>Your Cart</h2>
    <div v-if="cart">
      <div v-for="(item, index) in cart.items" :key="index">
        {{ item.productId }} x {{ item.quantity }} (${{ item.price }})
      </div>

      <div v-if="cart.discount > 0">
        <h3>Subtotal: ${{ cart.total }}</h3>
        <h3 class="discount">Discount: -${{ cart.discount }}</h3>
        <h3>Final Total: ${{ cart.finalTotal }}</h3>
      </div>
      <h3 v-else>Total: ${{ cart.total }}</h3>

      <div class="promo-section">
        <input v-model="promoCode" placeholder="Promo Code (e.g. WELCOME10)" />
        <button @click="applyPromo">Apply</button>
        <p v-if="promoMessage" class="message">{{ promoMessage }}</p>
      </div>

      <button @click="checkout" :disabled="cart.items.length === 0">Checkout</button>
    </div>
    <div v-else>Loading cart...</div>

    <div v-if="orderStatus" class="status">
      {{ orderStatus }}
    </div>
  </div>
</template>

<style scoped>
.cart { border: 1px solid #ccc; padding: 20px; margin-top: 20px; }
.status { margin-top: 10px; font-weight: bold; color: blue; }
.promo-section { margin: 15px 0; padding: 10px; background: #f9f9f9; }
.discount { color: green; }
</style>
