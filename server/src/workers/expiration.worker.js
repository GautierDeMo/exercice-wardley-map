const orderMachine = require('../modules/order/order.machine');

class ExpirationWorker {
  constructor({ prisma, stockService, emailService, getChannel }) {
    this.prisma = prisma;
    this.stockService = stockService;
    this.emailService = emailService;
    this.getChannel = getChannel;
  }

  async start() {
    const channel = this.getChannel();
    const queue = 'expiration_queue';

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'delayed_exchange', 'stock.expiration');

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const { orderId, productId, quantity } = JSON.parse(msg.content.toString());

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
          console.log(`Order ${orderId} not found, ignoring expiration.`);
          channel.ack(msg);
          return;
        }

        // Check if we should expire
        const nextState = orderMachine.transition(order.status, 'TIMEOUT');

        if (nextState.changed) {
          console.log(`Expiring Order ${orderId}. Releasing stock.`);
          await this.stockService.releaseStock(productId, quantity);
          await this.prisma.order.update({ where: { id: orderId }, data: { status: nextState.value } });

          // Trigger Recovery Email
          await this.emailService.sendAbandonedCartEmail(orderId);
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
}

module.exports = ExpirationWorker;
