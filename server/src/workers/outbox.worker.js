class OutboxWorker {
  constructor({ prisma, getChannel }) {
    this.prisma = prisma;
    this.getChannel = getChannel;
  }

  async process() {
    const channel = this.getChannel();

    // Fetch unpublished events
    const events = await this.prisma.outbox.findMany({
      where: { published: false },
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    for (const event of events) {
      try {
        const { type, payload } = event;

        if (type === 'STOCK_RESERVED') {
          // Publish to Delayed Exchange
          // Delay is hardcoded to 15 seconds for testing purposes (instead of 24h)
          // Use shorter delay (1s) in test environment to avoid timeouts
          const delay = process.env.NODE_ENV === 'test' ? 1000 : 15000;

          channel.publish('delayed_exchange', 'stock.expiration', Buffer.from(JSON.stringify(payload)), {
            headers: { 'x-delay': delay }
          });
        }

        // Mark as published
        await this.prisma.outbox.update({
          where: { id: event.id },
          data: { published: true }
        });

      } catch (error) {
        console.error(`Failed to process event ${event.id}`, error);
      }
    }
  }
}

module.exports = OutboxWorker;
