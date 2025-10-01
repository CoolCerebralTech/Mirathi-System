import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { DatabaseService } from '../services/database.service';
export declare class PrismaHealthIndicator extends HealthIndicator {
    private readonly databaseService;
    private readonly logger;
    private readonly key;
    getStatus: any;
    constructor(databaseService: DatabaseService);
    /**
     * Checks the health of the database using our custom DatabaseService.
     * This is the standard pattern for creating a custom health indicator.
     */
    isHealthy(): Promise<HealthIndicatorResult>;
}
//# sourceMappingURL=prisma-health.indicator.d.ts.map