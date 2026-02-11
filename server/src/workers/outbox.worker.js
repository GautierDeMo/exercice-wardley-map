const prisma = require('../config/db');
const { getChannel } = require('../config/rabbitmq');

const PROCESS_INTERVAL = 1000; // 1 second

async function processOutbox() {
  const channel = getChannel();

  // Fetch unpublished events
  const events = await prisma.outbox.findMany({
    where: { published: false },
    take: 50,
    orderBy: { createdAt: 'asc' }
  });

  for (const event of events) {
    try {
      const { type, payload } = event;

      if (type === 'STOCK_RESERVED') {
        // Publish to Delayed Exchange
        // Delay is hardcoded to 2 seconds for testing purposes (instead of 24h)
        const delay = 2000;

        channel.publish('delayed_exchange', 'stock.expiration', Buffer.from(JSON.stringify(payload)), {
          headers: { 'x-delay': delay }
        });
      }

      // Mark as published
      await prisma.outbox.update({
        where: { id: event.id },
        data: { published: true }
      });

    } catch (error) {
      console.error(`Failed to process event ${event.id}`, error);
    }
  }
}

module.exports = { processOutbox };
