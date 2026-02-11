<script setup>
import { ref, onMounted } from 'vue';
import api from './services/api';
import ProductList from './components/ProductList.vue';
import Cart from './components/Cart.vue';

const cartId = ref(null);
const cartRef = ref(null);

onMounted(async () => {
  // Create a fresh cart on load for this demo
  try {
    const res = await api.createCart();
    cartId.value = res.data.id;
  } catch (error) {
    console.error('Failed to init cart', error);
  }
});

const refreshCart = () => {
  if (cartRef.value) {
    cartRef.value.fetchCart();
  }
};
</script>

<template>
  <div class="container">
    <h1>Wardley Map Shop</h1>
    <div v-if="cartId">
      <ProductList :cartId="cartId" @item-added="refreshCart" />
      <Cart :cartId="cartId" ref="cartRef" />
    </div>
    <div v-else>Initializing Shop...</div>
  </div>
</template>

<style scoped>
.container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
</style>
