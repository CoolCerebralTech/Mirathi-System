// src/infrastructure/adapters/sms/africastalking.adapter.ts
import { Injectable } from '@nestjs/common';
import * as AfricasTalking from 'africastalking';

import { SmsProviderPort, SmsSendingResult } from '../../../domain/ports/sms-provider.port';

interface AfricasTalkingOptions {
  apiKey: string;
  username: string;
}

interface AfricasTalkingSmsResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

@Injectable()
export class AfricasTalkingSmsAdapter implements SmsProviderPort {
  private sms: any;

  constructor() {
    const options: AfricasTalkingOptions = {
      apiKey: process.env.AFRICASTALKING_API_KEY!,
      username: process.env.AFRICASTALKING_USERNAME!,
    };

    const africastalking = AfricasTalking(options);
    this.sms = africastalking.SMS;
  }

  async sendSms(to: string, message: string): Promise<SmsSendingResult> {
    try {
      const options = {
        to: [this.formatPhoneNumber(to)],
        message,
        from: process.env.AFRICASTALKING_SENDER_ID,
        enqueue: true,
      };

      const response: AfricasTalkingSmsResponse = await this.sms.send(options);
      const recipient = response.SMSMessageData.Recipients[0];

      return {
        success: recipient.statusCode === 101,
        messageId: recipient.messageId,
        providerResponse: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        providerResponse: error,
      };
    }
  }

  async sendOtp(to: string, otp: string, expiryMinutes: number = 5): Promise<SmsSendingResult> {
    const message = `Your verification code is ${otp}. Valid for ${expiryMinutes} minutes.`;

    return this.sendSms(to, message);
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // Africa's Talking doesn't provide OTP verification
    // We need to implement our own cache/database
    console.warn("OTP verification not implemented for Africa's Talking. Implement cache check.");
    return true;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    const formatted = this.formatPhoneNumber(phoneNumber);

    // Basic validation for East African numbers
    if (
      !formatted.startsWith('254') &&
      !formatted.startsWith('255') &&
      !formatted.startsWith('256')
    ) {
      return false;
    }

    // Check length
    return formatted.length >= 12 && formatted.length <= 13;
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'failed' | 'unknown';
    deliveredAt?: Date;
    error?: string;
  }> {
    try {
      // Africa's Talking provides delivery reports via callbacks
      // We need to store and retrieve from our database

      // For now, return unknown
      return {
        status: 'unknown',
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message,
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Convert to international format
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
   * Africa's Talking specific: Check SMS balance
   */
  async getSmsBalance(): Promise<{ balance: string; units: string }> {
    try {
      // Africa's Talking provides application info with balance
      const response = await this.sms.fetchApplicationData();

      return {
        balance: response.UserData.balance,
        units: 'KES',
      };
    } catch (error) {
      console.error("Failed to get Africa's Talking balance:", error.message);
      return { balance: '0', units: 'KES' };
    }
  }

  /**
   * Africa's Talking specific: Fetch SMS delivery reports
   */
  async fetchDeliveryReports(): Promise<any[]> {
    try {
      const response = await this.sms.fetchMessages({
        lastReceivedId: 0, // Get all messages
      });

      return response.SMSMessageData.Messages || [];
    } catch (error) {
      console.error('Failed to fetch delivery reports:', error.message);
      return [];
    }
  }
}
