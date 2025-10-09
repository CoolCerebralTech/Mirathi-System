import { Injectable } from '@nestjs/common';
import * as AfricasTalking from 'africastalking';
import { ConfigService } from '@shamba/config';
import { NotificationProvider, SendNotificationOptions, SendNotificationResult } from './provider.interface';

@Injectable()
export class AfricasTalkingSmsProvider implements NotificationProvider {
  private readonly sms: any;
  private readonly fromShortCode: string;

  constructor(private readonly configService: ConfigService) {
    this.sms = AfricasTalking({
      apiKey: this.configService.get('SMS_AT_API_KEY'),
      username: this.configService.get('SMS_AT_USERNAME'),
    }).SMS;
    this.fromShortCode = this.configService.get('SMS_AT_SHORTCODE') || undefined;
  }

  async send(options: SendNotificationOptions): Promise<SendNotificationResult> {
    try {
      const response = await this.sms.send({
        to: [options.to],
        message: options.body,
        from: options.from || this.fromShortCode,
      });
      const recipient = response.SMSMessageData.Recipients[0];
      if (recipient.statusCode !== 101) {
        return { success: false, error: recipient.status };
      }
      return { success: true, messageId: recipient.messageId };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown AT error' };
    }
  }
  
  async getHealth(): Promise<{ status: 'up' | 'down'; details?: string }> {
      // AT API does not have a simple ping/verify. We assume 'up' if initialized.
      // A true health check would involve fetching user data or balance.
      return { status: 'up' };
  }
}