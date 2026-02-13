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
  <div class="app-layout">
    <header class="header">
      <div class="container header-content">
        <div class="logo">
          <span class="logo-icon">🗺️</span>
          <h1>Wardley Shop</h1>
        </div>
      </div>
    </header>

    <main class="container main-content">
      <div v-if="cartId" class="shop-grid">
        <div class="products-section">
          <ProductList :cartId="cartId" @item-added="refreshCart" />
        </div>
        <div class="cart-section">
          <Cart :cartId="cartId" ref="cartRef" />
        </div>
      </div>
      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Initializing Shop...</p>
      </div>
    </main>
  </div>
</template>

<style>
/* Global Styles */
:root {
  --primary: #FF385C;
  --primary-hover: #D9324E;
  --text-main: #222222;
  --text-light: #717171;
  --border: #DDDDDD;
  --bg-light: #F7F7F7;
  --white: #FFFFFF;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
  --shadow-md: 0 6px 16px rgba(0,0,0,0.12);
  --radius-md: 12px;
  --radius-lg: 24px;
}

body {
  margin: 0;
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-main);
  background-color: var(--white);
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  transition: all 0.2s ease;
}
</style>

<style scoped>
.header {
  border-bottom: 1px solid var(--border);
  height: 80px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  background: var(--white);
  z-index: 100;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  width: 100%;
}

.header-content {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
}

.logo h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.logo-icon {
  font-size: 28px;
}

.main-content {
  padding-top: 40px;
  padding-bottom: 80px;
}

.shop-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 60px;
  align-items: start;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: var(--text-light);
}

@media (max-width: 900px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 24px;
  }
}
</style>
