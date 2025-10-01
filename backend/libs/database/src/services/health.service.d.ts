import { HealthCheckService, MemoryHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { PrismaHealthIndicator } from '../indicators/prisma-health.indicator';
export declare class HealthService {
    private readonly health;
    private readonly prismaHealth;
    private readonly memory;
    private readonly configService;
    private readonly logger;
    private readonly memoryHeapThreshold;
    constructor(health: HealthCheckService, prismaHealth: PrismaHealthIndicator, memory: MemoryHealthIndicator, configService: ConfigService);
    /**
     * Performs a standard health check for the service.
     * This should be used for Kubernetes liveness/readiness probes.
     */
    check(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=health.service.d.ts.map