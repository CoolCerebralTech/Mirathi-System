import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { MessagingService } from '@shamba/messaging';
export declare class MessagingHealthIndicator extends HealthIndicator {
    private readonly messagingService;
    private readonly key;
    constructor(messagingService: MessagingService);
    isHealthy(): Promise<HealthIndicatorResult>;
}
//# sourceMappingURL=messaging-health.indicator.d.ts.map