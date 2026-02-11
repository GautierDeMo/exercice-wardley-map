<script setup>
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps({
  cartId: String
});

const emit = defineEmits(['item-added']);

// Mock Catalog (since we don't have a Product API yet)
const products = ref([
  { id: 'p1', title: 'Laptop', price: 1000 },
  { id: 'p2', title: 'Mouse', price: 50 },
  { id: 'p3', title: 'Keyboard', price: 80 }
]);

const addToCart = async (product) => {
  if (!props.cartId) {
    alert("Cart not initialized");
    return;
  }

  try {
    await api.addItemToCart(props.cartId, {
      productId: product.id,
      quantity: 1,
      price: product.price
    });
    emit('item-added');
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Failed to add item');
  }
};
</script>

<template>
  <div class="product-list">
    <h2>Products</h2>
    <div v-for="product in products" :key="product.id" class="product-item">
      <span>{{ product.title }} - ${{ product.price }}</span>
      <button @click="addToCart(product)">Add to Cart</button>
    </div>
  </div>
</template>

<style scoped>
.product-item {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
}
</style>
