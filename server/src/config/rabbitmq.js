const amqp = require('amqplib');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  if (connection) return { connection, channel };

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert the delayed exchange plugin
    // This requires the rabbitmq_delayed_message_exchange plugin enabled in Docker
    await channel.assertExchange('delayed_exchange', 'x-delayed-message', {
      autoDelete: false,
      durable: true,
      arguments: { 'x-delayed-type': 'direct' }
    });

    console.log('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    throw error;
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ first.');
  }
  return channel;
};

const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    channel = null;
    connection = null;
  } catch (error) {
    console.error('Error closing RabbitMQ connection', error);
  }
};

module.exports = { connectRabbitMQ, getChannel, closeRabbitMQ };
