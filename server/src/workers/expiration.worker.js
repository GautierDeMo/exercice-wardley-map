const prisma = require('../config/db');
const stockService = require('../modules/stock/stock.service');
const orderMachine = require('../modules/order/order.machine');
const emailService = require('../modules/notification/email.service');
const { getChannel } = require('../config/rabbitmq');

async function startExpirationWorker() {
  const channel = getChannel();
  const queue = 'expiration_queue';

  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, 'delayed_exchange', 'stock.expiration');

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const { orderId, productId, quantity } = JSON.parse(msg.content.toString());

      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        console.log(`Order ${orderId} not found, ignoring expiration.`);
        channel.ack(msg);
        return;
      }

      // Check if we should expire
      const nextState = orderMachine.transition(order.status, 'TIMEOUT');

      if (nextState.changed) {
        console.log(`Expiring Order ${orderId}. Releasing stock.`);
        await stockService.releaseStock(productId, quantity);
        await prisma.order.update({ where: { id: orderId }, data: { status: nextState.value } });

        // Trigger Recovery Email
        await emailService.sendAbandonedCartEmail(orderId);
      } else {
        console.log(`Order ${orderId} is ${order.status}. No expiration needed.`);
      }

      channel.ack(msg);
    } catch (error) {
      console.error('Error processing expiration:', error);
      channel.nack(msg);
    }
  });
}

module.exports = { startExpirationWorker };
