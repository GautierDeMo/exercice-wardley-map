class EmailService {
  async sendAbandonedCartEmail(orderId) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[EMAIL MOCK] Sending recovery email for Order ${orderId} to user...`);
    return true;
  }
}

module.exports = EmailService;
