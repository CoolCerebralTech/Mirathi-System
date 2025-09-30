import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@shamba/config';
import { NotificationChannel } from '@shamba/common';
import { NOTIFICATION_PROVIDER } from './provider.interface';
import { SmtpEmailProvider } from './smtp-email.provider';
import { AfricasTalkingSmsProvider } from './africastalking-sms.provider';


@Module({})
export class ProvidersModule {
  static register(channel: NotificationChannel): DynamicModule {
    const provider = {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (configService: ConfigService) => {
        if (channel === NotificationChannel.EMAIL) {
          switch (configService.get('EMAIL_PROVIDER')) {
            case 'smtp':
              return new SmtpEmailProvider(configService);
            // Add cases for 'sendgrid', 'ses' here
            default:
              throw new Error('No valid EMAIL_PROVIDER configured');
          }
        }
        if (channel === NotificationChannel.SMS) {
          switch (configService.get('SMS_PROVIDER')) {
            case 'africas-talking':
              return new AfricasTalkingSmsProvider(configService);
            // Add case for 'twilio' here
            default:
              throw new Error('No valid SMS_PROVIDER configured');
          }
        }
        throw new Error(`No provider available for channel: ${channel}`);
      },
      inject: [ConfigService],
    };

    return {
      module: ProvidersModule,
      providers: [provider],
      exports: [provider],
    };
  }
}