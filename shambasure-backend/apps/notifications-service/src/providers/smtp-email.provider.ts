import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@shamba/config';
import { NotificationProvider, SendNotificationOptions, SendNotificationResult } from './provider.interface';

@Injectable()
export class SmtpEmailProvider implements NotificationProvider {
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_SMTP_HOST'),
      port: this.configService.get('EMAIL_SMTP_PORT'),
      secure: this.configService.get('EMAIL_SMTP_SECURE'),
      auth: {
        user: this.configService.get('EMAIL_SMTP_USER'),
        pass: this.configService.get('EMAIL_SMTP_PASS'),
      },
    });
    this.fromAddress = this.configService.get('EMAIL_FROM_ADDRESS');
  }

  async send(options: SendNotificationOptions): Promise<SendNotificationResult> {
    try {
      const result = await this.transporter.sendMail({
        from: options.from || this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.body,
      });
      return { success: true, messageId: result.messageId };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      return { success: false, error: message };
    }
  }

  async getHealth(): Promise<{ status: 'up' | 'down'; details?: string }> {
    try {
      const success = await this.transporter.verify();
      return success ? { status: 'up' } : { status: 'down', details: 'Verification failed' };
    } catch (error: unknown) {
      return { status: 'down', details: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}