const express = require('express');
const stockService = require('./stock.service');
const router = express.Router();

router.get('/:productId', async (req, res) => {
  try {
    const stock = await stockService.getStock(req.params.productId);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:productId/reserve', async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await stockService.reserveStock(req.params.productId, quantity);
    res.json(result);
  } catch (error) {
    if (error.message.includes('Insufficient') || error.message.includes('Concurrency')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.post('/:productId/release', async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await stockService.releaseStock(req.params.productId, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
