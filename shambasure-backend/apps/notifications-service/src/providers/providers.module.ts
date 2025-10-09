// ============================================================================
// providers.module.ts - Provider Registration (Updated)
// ============================================================================

import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@shamba/config';
import { NOTIFICATION_PROVIDER } from './provider.interface';
import { SmtpEmailProvider } from './smtp-email.provider';
import { AfricasTalkingSmsProvider } from './africastalking-sms.provider';

/**
 * ProvidersModule - Registers notification providers
 * Uses factory pattern to select provider based on configuration
 */
@Module({})
export class ProvidersModule {
  static register(): DynamicModule {
    return {
      module: ProvidersModule,
      providers: [
        // Email Provider
        {
          provide: `${NOTIFICATION_PROVIDER}_EMAIL`,
          useFactory: (configService: ConfigService) => {
            const provider = configService.get('EMAIL_PROVIDER') || 'smtp';

            switch (provider) {
              case 'smtp':
                return new SmtpEmailProvider(configService);
              // Future: Add SendGrid, AWS SES, etc.
              default:
                throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
            }
          },
          inject: [ConfigService],
        },
        // SMS Provider
        {
          provide: `${NOTIFICATION_PROVIDER}_SMS`,
          useFactory: (configService: ConfigService) => {
            const provider = configService.get('SMS_PROVIDER') || 'africas-talking';

            switch (provider) {
              case 'africas-talking':
                return new AfricasTalkingSmsProvider(configService);
              // Future: Add Twilio, AWS SNS, etc.
              default:
                throw new Error(`Unknown SMS_PROVIDER: ${provider}`);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: [`${NOTIFICATION_PROVIDER}_EMAIL`, `${NOTIFICATION_PROVIDER}_SMS`],
    };
  }
}
