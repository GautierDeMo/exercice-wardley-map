const express = require('express');
const { container } = require('../../container');
const router = express.Router();

// Create Order from Cart
router.post('/', async (req, res) => {
  try {
    const { cartId } = req.body;
    const order = await container.orderService.createOrder(cartId);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger Checkout (Draft -> Pending)
router.post('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await container.orderService.checkout(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Webhook (Pending -> Paid OR Expired -> Conflict)
router.post('/:id/payment-webhook', async (req, res) => {
  try {
    const { id } = req.params;
    const { success } = req.body;
    if (!success) return res.json({ message: 'Payment failed, no state change' });
    const updatedOrder = await container.orderService.handlePaymentSuccess(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
