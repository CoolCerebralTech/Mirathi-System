import { Injectable, Logger } from '@nestjs/common';
import * as AfricasTalking from 'africastalking';
import * as twilio from 'twilio';
import { ShambaConfigService } from '@shamba/config';
import { LoggerService } from '@shamba/observability';

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

@Injectable()
export class SmsProvider {
  private africasTalking: any;
  private twilioClient: twilio.Twilio;
  private readonly logger = new Logger(SmsProvider.name);

  constructor(
    private configService: ShambaConfigService,
    private observabilityLogger: LoggerService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const smsConfig = this.configService.sms;

    try {
      // Initialize Africa's Talking if configured
      if (smsConfig.provider === 'africas-talking' && smsConfig.africasTalking) {
        this.africasTalking = AfricasTalking({
          apiKey: smsConfig.africasTalking.apiKey,
          username: smsConfig.africasTalking.username,
        });
        this.logger.log('Africa\'s Talking SMS provider initialized');
      }

      // Initialize Twilio if configured
      if (smsConfig.provider === 'twilio' && smsConfig.twilio) {
        this.twilioClient = twilio(
          smsConfig.twilio.accountSid,
          smsConfig.twilio.authToken
        );
        this.logger.log('Twilio SMS provider initialized');
      }

      if (!this.africasTalking && !this.twilioClient) {
        this.logger.warn('No SMS provider configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize SMS provider', error);
    }
  }

  async sendSms(options: SmsOptions): Promise<SmsResult> {
    const startTime = Date.now();
    const smsConfig = this.configService.sms;

    try {
      let result: SmsResult;

      switch (smsConfig.provider) {
        case 'africas-talking':
          result = await this.sendViaAfricasTalking(options);
          break;

        case 'twilio':
          result = await this.sendViaTwilio(options);
          break;

        default:
          throw new Error(`SMS provider not configured or not supported: ${smsConfig.provider}`);
      }

      const duration = Date.now() - startTime;
      this.observabilityLogger.info('SMS sent successfully', 'SmsProvider', {
        to: options.to,
        messageId: result.messageId,
        duration,
        cost: result.cost,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.observabilityLogger.error('Failed to send SMS', 'SmsProvider', {
        to: options.to,
        error: error.message,
        duration,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendViaAfricasTalking(options: SmsOptions): Promise<SmsResult> {
    const smsConfig = this.configService.sms.africasTalking;
    
    if (!this.africasTalking || !smsConfig) {
      throw new Error('Africa\'s Talking not configured');
    }

    const sms = this.africasTalking.SMS;

    const response = await sms.send({
      to: [options.to],
      message: options.message,
      from: options.from || smsConfig.shortCode,
    });

    if (response.SMSMessageData.Recipients[0].statusCode !== 101) {
      throw new Error(`SMS failed: ${response.SMSMessageData.Recipients[0].status}`);
    }

    return {
      success: true,
      messageId: response.SMSMessageData.Recipients[0].messageId,
      cost: parseFloat(response.SMSMessageData.Recipients[0].cost) || 0,
    };
  }

  private async sendViaTwilio(options: SmsOptions): Promise<SmsResult> {
    const smsConfig = this.configService.sms.twilio;
    
    if (!this.twilioClient || !smsConfig) {
      throw new Error('Twilio not configured');
    }

    const message = await this.twilioClient.messages.create({
      body: options.message,
      to: options.to,
      from: options.from || smsConfig.fromNumber,
    });

    if (message.status !== 'accepted' && message.status !== 'queued' && message.status !== 'sent') {
      throw new Error(`SMS failed with status: ${message.status}`);
    }

    return {
      success: true,
      messageId: message.sid,
      cost: parseFloat(message.price || '0'),
    };
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    
    if (!phoneRegex.test(phoneNumber)) {
      return false;
    }

    // Kenya-specific validation (starts with +254 or 07...)
    if (phoneNumber.startsWith('+254') || phoneNumber.startsWith('254')) {
      return phoneNumber.replace(/[^\d]/g, '').length === 12;
    }

    if (phoneNumber.startsWith('07') || phoneNumber.startsWith('01')) {
      return phoneNumber.replace(/[^\d]/g, '').length === 10;
    }

    return true; // Allow international numbers
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Normalize to E.164 format for Kenya numbers
    const digits = phoneNumber.replace(/[^\d]/g, '');

    if (digits.startsWith('254') && digits.length === 12) {
      return `+${digits}`;
    }

    if (digits.startsWith('07') && digits.length === 10) {
      return `+254${digits.substring(1)}`;
    }

    if (digits.startsWith('7') && digits.length === 9) {
      return `+254${digits}`;
    }

    // Return as is for international numbers
    return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`;
  }

  async getBalance(): Promise<{ provider: string; balance?: number; currency?: string }> {
    const smsConfig = this.configService.sms;

    try {
      switch (smsConfig.provider) {
        case 'africas-talking':
          // Africa's Talking balance check would go here
          return { provider: 'africas-talking', balance: 0, currency: 'KES' };

        case 'twilio':
          if (this.twilioClient) {
            const balance = await this.twilioClient.balance.fetch();
            return { 
              provider: 'twilio', 
              balance: parseFloat(balance.balance),
              currency: balance.currency 
            };
          }
          break;

        default:
          return { provider: 'unknown' };
      }
    } catch (error) {
      this.logger.error('Failed to get SMS balance', error);
    }

    return { provider: smsConfig.provider || 'unknown' };
  }

  getProviderInfo(): { provider: string; status: string } {
    return {
      provider: this.configService.sms.provider || 'none',
      status: (this.africasTalking || this.twilioClient) ? 'connected' : 'disconnected',
    };
  }
}