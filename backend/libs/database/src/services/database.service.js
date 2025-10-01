"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.HealthStatus = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
// ============================================================================
// ARCHITECTURAL NOTE: The Role of the DatabaseService
// ============================================================================
// In our microservice architecture, this shared DatabaseService has a very
// specific and limited responsibility: providing universal, business-agnostic
// database utilities.
//
// Its primary function is to offer a standardized health check.
//
// Functionalities like `getStats`, `createBackup`, and `cleanupOldData` have
// been intentionally REMOVED from this shared library for the following reasons:
//
// 1. `getStats()`: This function had knowledge of specific models (`Will`, `Asset`),
//    which created a tight coupling between this library and the services that
//    own those models. A shared library must NEVER depend on the business
//    logic of an individual service. Stats should be gathered by an administrative
//    service that calls the respective microservices' APIs.
//
// 2. `createBackup()`: Database backups are an INFRASTRUCTURE concern, not an
//    application concern. They should be handled by automated jobs (e.g., cron,
//    Kubernetes CronJobs) or managed cloud services (e.g., AWS RDS snapshots),
//    completely outside the application's runtime.
//
// 3. `cleanupOldData()`: Data retention and cleanup policies are business rules
//    owned by the service that owns the data. For example, the `auditing-service`
//    is responsible for cleaning its own logs. This logic belongs within that
//    service, likely triggered by a scheduled task (`@nestjs/schedule`).
// ============================================================================
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["UP"] = "up";
    HealthStatus["DOWN"] = "down";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
let DatabaseService = DatabaseService_1 = class DatabaseService {
    prisma;
    logger = new common_1.Logger(DatabaseService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Performs a health check on the database connection.
     * This is a safe, read-only operation used by observability tools.
     * @returns A HealthCheckResult object indicating the database status.
     */
    async getHealth() {
        try {
            // `$queryRaw` is the most reliable way to check raw connectivity.
            // `SELECT 1` is a standard, lightweight ping query.
            await this.prisma.$queryRaw `SELECT 1`;
            this.logger.verbose('Database health check successful.');
            return {
                status: HealthStatus.UP,
                details: 'Database connection is healthy.',
            };
        }
        catch (error) {
            this.logger.error('Database health check failed.', error);
            return {
                status: HealthStatus.DOWN,
                details: 'Database connection failed.',
            };
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map