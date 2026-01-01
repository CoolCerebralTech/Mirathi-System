// src/infrastructure/adapters/sms/safaricom.adapter.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { SmsProviderPort, SmsSendingResult } from '../../../domain/ports/sms-provider.port';

interface SafaricomAccessToken {
  access_token: string;
  expires_in: number;
}

interface SafaricomSmsResponse {
  responses: Array<{
    statusCode: string;
    statusMessage: string;
    requestId: string;
    destination: string;
  }>;
}

@Injectable()
export class SafaricomSmsAdapter implements SmsProviderPort {
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortCode: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.consumerKey = process.env.SAFARICOM_CONSUMER_KEY!;
    this.consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET!;
    this.shortCode = process.env.SAFARICOM_SMS_SHORTCODE!;
  }

  async sendSms(to: string, message: string): Promise<SmsSendingResult> {
    try {
      await this.ensureAccessToken();

      const formattedNumber = this.formatPhoneNumber(to);

      const response = await axios.post<SafaricomSmsResponse>(
        'https://api.safaricom.co.ke/v1/sms/send',
        {
          senderID: this.shortCode,
          message,
          recipients: [
            {
              mobileNumber: formattedNumber,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = response.data.responses[0];

      return {
        success: result.statusCode === '200',
        messageId: result.requestId,
        providerResponse: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        providerResponse: error.response?.data,
      };
    }
  }

  async sendOtp(to: string, otp: string, expiryMinutes: number = 5): Promise<SmsSendingResult> {
    const message = `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`;

    return this.sendSms(to, message);
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // Safaricom doesn't provide OTP verification API
    // We need to handle OTP verification in our own cache/database
    // This method should check against stored OTP in cache

    // For now, we'll implement a mock that always returns true
    // Real implementation would check Redis cache
    console.warn('OTP verification not implemented for Safaricom. Implement cache check.');
    return true;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    const formatted = this.formatPhoneNumber(phoneNumber);

    // Basic validation for Kenyan numbers
    if (!formatted.startsWith('254')) {
      return false;
    }

    // Check if it's a valid Safaricom prefix
    const safaricomPrefixes = ['70', '71', '72', '74', '75', '76', '77', '78', '79'];
    const prefix = formatted.substring(3, 5); // Get first two digits after 254

    return safaricomPrefixes.includes(prefix);
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'failed' | 'unknown';
    deliveredAt?: Date;
    error?: string;
  }> {
    // Safaricom doesn't provide delivery status API
    // We need to implement callbacks/webhooks

    return {
      status: 'unknown',
    };
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    const response = await axios.post<SafaricomAccessToken>(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
  }

  private formatPhoneNumber(phone: string): string {
    // Convert to 254 format
    let formatted = phone.replace(/\D/g, '');

    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }

    return formatted;
  }

  /**
   * Safaricom-specific: Check account balance
   */
  async getAccountBalance(): Promise<{ balance: number; currency: string }> {
    await this.ensureAccessToken();

    try {
      const response = await axios.get('https://api.safaricom.co.ke/v1/sms/balance', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        balance: response.data.balance,
        currency: 'KES',
      };
    } catch (error) {
      console.error('Failed to get Safaricom balance:', error.message);
      return { balance: 0, currency: 'KES' };
    }
  }
}
