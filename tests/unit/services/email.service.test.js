const config = require('../../../src/config/config');
const { emailService } = require('../../../src/services');

describe('Email service', () => {
  describe('sendResetPasswordEmail', () => {
    test('should build the reset password link from config.frontendUrl', async () => {
      const sendMailSpy = jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
      const to = 'user@example.com';
      const token = 'reset-token';

      await emailService.sendResetPasswordEmail(to, token);

      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      const msg = sendMailSpy.mock.calls[0][0];
      expect(msg.to).toBe(to);
      expect(msg.subject).toBe('Reset password');
      expect(msg.text).toContain(`${config.frontendUrl}/reset-password?token=${token}`);
    });
  });

  describe('sendVerificationEmail', () => {
    test('should build the verify email link from config.frontendUrl', async () => {
      const sendMailSpy = jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
      const to = 'user@example.com';
      const token = 'verify-token';

      await emailService.sendVerificationEmail(to, token);

      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      const msg = sendMailSpy.mock.calls[0][0];
      expect(msg.to).toBe(to);
      expect(msg.subject).toBe('Email Verification');
      expect(msg.text).toContain(`${config.frontendUrl}/verify-email?token=${token}`);
    });
  });
});
