import { PrismaService } from './prisma.service';
export declare enum HealthStatus {
    UP = "up",
    DOWN = "down"
}
export interface HealthCheckResult {
    status: HealthStatus;
    details: string;
}
export declare class DatabaseService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Performs a health check on the database connection.
     * This is a safe, read-only operation used by observability tools.
     * @returns A HealthCheckResult object indicating the database status.
     */
    getHealth(): Promise<HealthCheckResult>;
}
//# sourceMappingURL=database.service.d.ts.map