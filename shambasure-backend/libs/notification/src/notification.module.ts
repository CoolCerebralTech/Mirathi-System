import { Module, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { INotificationService } from './interfaces/notification.interface';

@Module({
  providers: [
    Logger,
    NotificationService,
    {
      provide: INotificationService,
      useExisting: NotificationService,
    },
  ],
  exports: [NotificationService, INotificationService],
})
export class NotificationModule {}
