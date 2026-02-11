const emailService = require('../../src/modules/notification/email.service');

describe('EmailService', () => {
  it('should simulate sending an email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await emailService.sendAbandonedCartEmail('order-123');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EMAIL MOCK]'));
    consoleSpy.mockRestore();
  });
});
