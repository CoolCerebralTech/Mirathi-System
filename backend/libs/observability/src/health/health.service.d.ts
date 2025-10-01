import { HealthCheckService, MemoryHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@shamba/database';
import { ConfigService } from '@shamba/config';
import { MessagingHealthIndicator } from './messaging-health.indicator';
export declare class HealthService {
    private readonly health;
    private readonly memory;
    private readonly prismaHealth;
    private readonly messagingHealth;
    private readonly configService;
    private readonly memoryHeapThreshold;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, prismaHealth: PrismaHealthIndicator, messagingHealth: MessagingHealthIndicator, configService: ConfigService);
    /**
     * Performs a readiness check, verifying all critical downstream dependencies.
     * This should be used for Kubernetes readiness probes.
     */
    checkReadiness(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=health.service.d.ts.map