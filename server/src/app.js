const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const app = express();

const stockRoutes = require('./modules/stock/stock.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/order/order.routes');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startExpirationWorker } = require('./workers/expiration.worker');
const { processOutbox } = require('./workers/outbox.worker');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hello from Backend' });
});

// Module Routes
app.use('/api/stock', stockRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server if not in test mode
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  const init = async () => {
    try {
      await connectRabbitMQ();
      await startExpirationWorker();
      setInterval(processOutbox, 1000); // Poll Outbox every 1s

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  };

  init();
}

module.exports = app;
