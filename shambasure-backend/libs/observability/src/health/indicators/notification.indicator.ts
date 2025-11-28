import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { NotificationService } from '@shamba/notification';

@Injectable()
export class NotificationHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(NotificationHealthIndicator.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async isHealthy(key = 'notification'): Promise<HealthIndicatorResult> {
    try {
      await this.notificationService.healthCheck();
      return this.getStatus(key, true, { message: 'Notification service OK' });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error('Notification health check failed', error.message);

      const result = this.getStatus(key, false, {
        message: 'Notification service unreachable',
        error: (process.env.NODE_ENV ?? 'production') === 'development' ? error.message : undefined,
      });

      throw new HealthCheckError('Notification check failed', result);
    }
  }
}
