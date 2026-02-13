const EmailService = require('../../src/modules/notification/email.service');

describe('EmailService', () => {
  it('should simulate sending an email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const emailService = new EmailService();
    await emailService.sendAbandonedCartEmail('order-123');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL MOCK]'));
    consoleSpy.mockRestore();
  });
});
