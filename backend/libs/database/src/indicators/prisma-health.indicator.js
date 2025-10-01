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
var PrismaHealthIndicator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const database_service_1 = require("../services/database.service");
let PrismaHealthIndicator = PrismaHealthIndicator_1 = class PrismaHealthIndicator extends terminus_1.HealthIndicator {
    databaseService;
    logger = new common_1.Logger(PrismaHealthIndicator_1.name);
    key = 'database'; // The key for our health check result
    getStatus;
    constructor(databaseService) {
        super();
        this.databaseService = databaseService;
    }
    /**
     * Checks the health of the database using our custom DatabaseService.
     * This is the standard pattern for creating a custom health indicator.
     */
    async isHealthy() {
        const healthResult = await this.databaseService.getHealth();
        const isHealthy = healthResult.status === database_service_1.HealthStatus.UP;
        // `getStatus` is a utility from HealthIndicator that formats the result.
        const result = this.getStatus(this.key, isHealthy, {
            details: healthResult.details,
        });
        if (isHealthy) {
            this.logger.verbose('Prisma health indicator check successful.');
            return result;
        }
        // If not healthy, throw an error that Terminus will catch and handle.
        throw new terminus_1.HealthCheckError('Prisma health check failed', result);
    }
};
exports.PrismaHealthIndicator = PrismaHealthIndicator;
exports.PrismaHealthIndicator = PrismaHealthIndicator = PrismaHealthIndicator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PrismaHealthIndicator);
//# sourceMappingURL=prisma-health.indicator.js.map