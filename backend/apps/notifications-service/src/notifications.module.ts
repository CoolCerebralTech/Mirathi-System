import { Module, OnModuleInit, Injectable, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { NotificationsController } from './controllers/notifications.controller';
import { TemplatesController } from './controllers/templates.controller';
import { NotificationsService } from './services/notifications.service';
import { TemplatesService } from './services/templates.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { TemplatesRepository } from './repositories/templates.repository';
import { ProvidersModule } from './providers/providers.module';
import { NotificationChannel } from '@shamba/common';
import { DEFAULT_TEMPLATES } from './templates/default-templates';

// --- New Seeder Provider ---
@Injectable()
export class TemplateSeeder implements OnModuleInit {
  private readonly logger = new Logger(TemplateSeeder.name);
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async onModuleInit() {
    this.logger.log('Checking for default templates...');
    for (const template of DEFAULT_TEMPLATES) {
      const existing = await this.templatesRepository.findOne({ name: template.name });
      if (!existing) {
        await this.templatesRepository.create(template);
        this.logger.log(`Created default template: ${template.name}`);
      }
    }
  }
}

@Module({
  imports: [
    // --- Core & Shared Libraries ---
    ConfigModule,
    DatabaseModule,
    AuthModule,
    ScheduleModule.forRoot(),
    MessagingModule.register({ queue: Queue.NOTIFICATIONS_EVENTS }),
    ObservabilityModule.register({
      serviceName: 'notifications-service',
      version: '1.0.0',
    }),
    
    // --- Provider Modules ---
    // Register our dynamic provider factories for each channel
    ProvidersModule.register(NotificationChannel.EMAIL),
    ProvidersModule.register(NotificationChannel.SMS),
  ],
  controllers: [NotificationsController, TemplatesController],
  providers: [
    NotificationsService,
    TemplatesService,
    NotificationsRepository,
    TemplatesRepository,
    TemplateSeeder, // Add the seeder to the providers
  ],
})
export class NotificationsModule {}