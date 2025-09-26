import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as htmlToText from 'html-to-text';
import { ShambaConfigService } from '@shamba/config';
import { LoggerService } from '@shamba/observability';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailProvider.name);

  constructor(
    private configService: ShambaConfigService,
    private observabilityLogger: LoggerService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.email;

    try {
      switch (emailConfig.provider) {
        case 'smtp':
          if (!emailConfig.smtp) {
            throw new Error('SMTP configuration is missing');
          }
          
          this.transporter = nodemailer.createTransporter({
            host: emailConfig.smtp.host,
            port: emailConfig.smtp.port,
            secure: emailConfig.smtp.secure,
            auth: {
              user: emailConfig.smtp.auth.user,
              pass: emailConfig.smtp.auth.pass,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
          });
          break;

        case 'sendgrid':
          // For SendGrid, we'd use their API directly
          // This is a placeholder for SendGrid implementation
          this.logger.warn('SendGrid provider not fully implemented');
          break;

        case 'ses':
          // AWS SES implementation would go here
          this.logger.warn('SES provider not fully implemented');
          break;

        default:
          throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
      }

      this.logger.log(`Email provider initialized: ${emailConfig.provider}`);
    } catch (error) {
      this.logger.error('Failed to initialize email provider', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      const emailOptions: nodemailer.SendMailOptions = {
        from: options.from || this.configService.email.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(emailOptions);

      const duration = Date.now() - startTime;
      this.observabilityLogger.info('Email sent successfully', 'EmailProvider', {
        to: options.to,
        messageId: result.messageId,
        duration,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.observabilityLogger.error('Failed to send email', 'EmailProvider', {
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

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email connection verification failed', error);
      return false;
    }
  }

  compileTemplate(template: string, variables: Record<string, any>): string {
    try {
      const compiledTemplate = handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      this.logger.error('Failed to compile email template', error);
      throw new Error(`Template compilation failed: ${error.message}`);
    }
  }

  private htmlToText(html: string): string {
    return htmlToText.convert(html, {
      wordwrap: 80,
      ignoreImage: true,
      ignoreHref: true,
    });
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Send emails in batches to avoid overwhelming the provider
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(email => this.sendEmail(email))
      );
      
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  getProviderInfo(): { provider: string; status: string } {
    return {
      provider: this.configService.email.provider,
      status: this.transporter ? 'connected' : 'disconnected',
    };
  }
}