/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import AfricasTalking from 'africastalking';
import { ConfigService } from '@shamba/config';
import {
  NotificationProvider,
  SendNotificationOptions,
  SendNotificationResult,
} from './provider.interface';

interface AfricasTalkingRecipient {
  number: string;
  status: string;
  statusCode: number;
  messageId: string;
  cost: string;
}

interface AfricasTalkingResponse {
  SMSMessageData: {
    Message: string;
    Recipients: AfricasTalkingRecipient[];
  };
}

@Injectable()
export class AfricasTalkingSmsProvider implements NotificationProvider {
  private readonly sms: any;
  private readonly fromShortCode?: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('SMS_AT_API_KEY')!;
    const username = this.config.get('SMS_AT_USERNAME')!;

    const at = AfricasTalking({ apiKey, username });
    this.sms = at.SMS;

    this.fromShortCode = this.config.get('SMS_AT_SHORTCODE') || undefined;
  }

  async send(options: SendNotificationOptions): Promise<SendNotificationResult> {
    try {
      const response = (await this.sms.send({
        to: [options.to],
        message: options.body,
        from: options.from ?? this.fromShortCode,
      })) as AfricasTalkingResponse;

      const recipient = response.SMSMessageData.Recipients?.[0];

      if (!recipient || recipient.statusCode !== 101) {
        return {
          success: false,
          error: recipient?.status ?? 'AfricasTalking: Unknown delivery error',
        };
      }

      return { success: true, messageId: recipient.messageId };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AfricasTalking: Unknown error',
      };
    }
  }

  async getHealth(): Promise<{ status: 'up' | 'down'; details?: string }> {
    return { status: 'up' };
  }
}
