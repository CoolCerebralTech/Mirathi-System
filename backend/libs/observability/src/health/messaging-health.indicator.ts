import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { MessagingService } from '@shamba/messaging';

@Injectable()
export class MessagingHealthIndicator extends HealthIndicator {
  private readonly key = 'message_broker';

  constructor(private readonly messagingService: MessagingService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const brokerHealth = this.messagingService.getHealth();
    const isHealthy = brokerHealth.isConnected;
    const result = this.getStatus(this.key, isHealthy, { details: brokerHealth.error });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Message broker health check failed', result);
  }
}