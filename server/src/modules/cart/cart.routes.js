const express = require('express');
const cartService = require('./cart.service');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const cart = await cartService.createCart();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cart = await cartService.getCart(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;
    await cartService.addItem(req.params.id, { productId, quantity, price });
    const cart = await cartService.getCart(req.params.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
