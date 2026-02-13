<script setup>
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps({
  cartId: String
});

const emit = defineEmits(['item-added']);

// Mock Catalog (since we don't have a Product API yet)
const products = ref([
  { id: 'p1', title: 'Wardley Map Pro Kit', price: 1000, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80' },
  { id: 'p2', title: 'Strategy Mouse', price: 50, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80' },
  { id: 'p3', title: 'Mechanical Keyboard', price: 80, image: 'https://images.unsplash.com/photo-1626958390898-162d3577f293?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
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
  <div class="product-list-container">
    <h2 class="section-title">Explore Products</h2>
    <div class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="image-wrapper">
          <img :src="product.image" :alt="product.title" />
          <button class="add-btn" @click="addToCart(product)">
            Add
          </button>
        </div>
        <div class="product-info">
          <div class="product-header">
            <h3 class="product-title">{{ product.title }}</h3>
            <span class="product-price">${{ product.price }}</span>
          </div>
          <p class="product-desc">Essential tool for your strategic mapping journey.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-main);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.image-wrapper {
  position: relative;
  aspect-ratio: 1 / 1; /* Square images like Airbnb listings */
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #f0f0f0;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .image-wrapper img {
  transform: scale(1.05);
}

.add-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: var(--white);
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.2s ease;
}

.product-card:hover .add-btn {
  opacity: 1;
  transform: translateY(0);
}

.add-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.add-btn:active {
  transform: scale(0.95);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--text-main);
}

.product-price {
  font-weight: 600;
  color: var(--text-main);
}

.product-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
}
</style>
