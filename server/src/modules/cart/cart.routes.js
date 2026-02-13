const express = require('express');
const { container } = require('../../container');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const cart = await container.cartService.createCart();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cart = await container.cartService.getCart(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;
    await container.cartService.addItem(req.params.id, { productId, quantity, price });
    const cart = await container.cartService.getCart(req.params.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/items/:productId', async (req, res) => {
  try {
    await container.cartService.removeItem(req.params.id, req.params.productId);
    const cart = await container.cartService.getCart(req.params.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/promo', async (req, res) => {
  try {
    const { code } = req.body;
    const cart = await container.cartService.applyPromotion(req.params.id, code);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
