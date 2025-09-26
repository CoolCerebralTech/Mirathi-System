import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { NotificationsController } from './controllers/notifications.controller';
import { TemplatesController } from './controllers/templates.controller';
import { NotificationService } from './services/notification.service';
import { TemplateService } from './services/template.service';
import { NotificationRepository } from './repositories/notification.repository';
import { TemplateRepository } from './repositories/template.repository';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { NotificationConsumer } from './consumers/notification.consumer';
import { DEFAULT_TEMPLATES } from './templates/default-templates';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.forRoot(),
    ObservabilityModule.forRoot(),
  ],
  controllers: [NotificationsController, TemplatesController],
  providers: [
    NotificationService,
    TemplateService,
    NotificationRepository,
    TemplateRepository,
    EmailProvider,
    SmsProvider,
    NotificationConsumer,
  ],
  exports: [NotificationService, TemplateService],
})
export class NotificationModule implements OnModuleInit {
  constructor(
    private templateService: TemplateService,
    private templateRepository: TemplateRepository,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultTemplates();
  }

  private async initializeDefaultTemplates() {
    for (const templateData of DEFAULT_TEMPLATES) {
      try {
        const existing = await this.templateRepository.findByName(templateData.name);
        if (!existing) {
          await this.templateService.createTemplate(templateData);
          console.log(`Created default template: ${templateData.name}`);
        }
      } catch (error) {
        console.error(`Failed to create template ${templateData.name}:`, error.message);
      }
    }
  }
}