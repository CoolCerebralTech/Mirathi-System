// src/domain/ports/sms-provider.port.ts

/**
 * SMS sending result
 */
export interface SmsSendingResult {
  success: boolean;
  messageId?: string;
  providerResponse?: any;
  error?: string;
}

/**
 * SMS provider port for sending messages (OTP, notifications)
 */
export interface SmsProviderPort {
  /**
   * Send SMS message
   */
  sendSms(to: string, message: string): Promise<SmsSendingResult>;

  /**
   * Send OTP (one-time password)
   */
  sendOtp(to: string, otp: string, expiryMinutes?: number): Promise<SmsSendingResult>;

  /**
   * Verify OTP
   */
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;

  /**
   * Check if a phone number is valid and reachable
   */
  validatePhoneNumber(phoneNumber: string): Promise<boolean>;

  /**
   * Get delivery status of a message
   */
  getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'failed' | 'unknown';
    deliveredAt?: Date;
    error?: string;
  }>;
}
