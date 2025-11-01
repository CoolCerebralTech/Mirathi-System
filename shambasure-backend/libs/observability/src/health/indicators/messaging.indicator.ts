import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { MessagingService } from '@shamba/messaging';

// Define the expected shape of the broker health response
interface BrokerHealth {
  isConnected: boolean;
  error?: string;
  brokerUrl?: string;
}

@Injectable()
export class MessagingHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(MessagingHealthIndicator.name);
  private readonly key = 'message_broker';

  constructor(private readonly messagingService: MessagingService) {
    super();
  }

  isHealthy(): HealthIndicatorResult {
    try {
      const brokerHealth: BrokerHealth = this.messagingService.getHealth(); // no await
      const isHealthy = brokerHealth.isConnected;

      const result = this.getStatus(this.key, isHealthy, {
        isConnected: brokerHealth.isConnected,
        error: brokerHealth.error ?? null,
        brokerUrl: brokerHealth.brokerUrl ?? undefined,
      });

      if (isHealthy) {
        this.logger.debug('Message broker health check successful', {
          brokerUrl: brokerHealth.brokerUrl,
        });
        return result;
      }

      this.logger.error(
        `Message broker health check failed: ${brokerHealth.error ?? 'Unknown error'}`,
        { brokerUrl: brokerHealth.brokerUrl },
      );
      throw new HealthCheckError('Message broker health check failed', result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error('Message broker health check threw an exception', {
        error: errorMessage,
      });
      const result = this.getStatus(this.key, false, {
        isConnected: false,
        error: errorMessage,
      });
      throw new HealthCheckError('Message broker health check failed', result);
    }
  }
}
