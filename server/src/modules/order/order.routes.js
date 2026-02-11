const express = require('express');
const orderMachine = require('./order.machine');
const stockService = require('../stock/stock.service');
const prisma = require('../../config/db');
const router = express.Router();

// Create Order from Cart
router.post('/', async (req, res) => {
  try {
    const { cartId } = req.body;
    // In a real app, we would fetch cart items and calculate total here
    // For now, we mock the total and items snapshot
    const order = await prisma.order.create({
      data: {
        status: orderMachine.initialState.value,
        total: 100.00, // Mocked
        items: []      // Mocked
      }
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger Checkout (Draft -> Pending)
router.post('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const nextState = orderMachine.transition(order.status, 'CHECKOUT');

    if (!nextState.changed) {
      return res.status(400).json({ error: `Invalid transition from ${order.status} via CHECKOUT` });
    }

    // Trigger Stock Reservation (Side Effect)
    // In a real app, we would loop over items. Here we assume 1 item for simplicity or mock it.
    // We use a fixed productId 'p1' and quantity 1 for this exercise's flow demonstration.
    const mockProductId = 'p1';
    const mockQuantity = 1;

    await stockService.reserveStock(mockProductId, mockQuantity, id);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextState.value }
    });

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

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const nextState = orderMachine.transition(order.status, 'PAYMENT_SUCCESS');

    if (!nextState.changed) {
      // Idempotency: If already Paid, just return success
      if (order.status === 'Paid') return res.json(order);
      return res.status(400).json({ error: `Invalid transition from ${order.status} via PAYMENT_SUCCESS` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextState.value }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
