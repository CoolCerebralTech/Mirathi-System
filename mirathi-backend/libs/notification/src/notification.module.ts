import { Logger, Module } from '@nestjs/common';

import { INotificationService } from './interfaces/notification.interface';
import { NotificationService } from './notification.service';

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
