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
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const config_1 = require("@nestjs/config");
const prisma_health_indicator_1 = require("../indicators/prisma-health.indicator");
// ============================================================================
// ARCHITECTURAL NOTE:
// This generic HealthService provides universal, business-agnostic health checks.
// The `detailedHealth` method has been REMOVED because it contained business-
// specific logic (database stats) that violates the principles of a shared library.
// Each microservice can expose its own separate `/stats` endpoint if needed.
// ============================================================================
let HealthService = HealthService_1 = class HealthService {
    health;
    prismaHealth;
    memory;
    configService;
    logger = new common_1.Logger(HealthService_1.name);
    memoryHeapThreshold;
    constructor(health, prismaHealth, memory, configService) {
        this.health = health;
        this.prismaHealth = prismaHealth;
        this.memory = memory;
        this.configService = configService;
        // Get memory threshold from config, defaulting to 256MB.
        this.memoryHeapThreshold =
            this.configService.get('HEALTH_MEMORY_HEAP_THRESHOLD_MB', 256) * 1024 * 1024;
    }
    /**
     * Performs a standard health check for the service.
     * This should be used for Kubernetes liveness/readiness probes.
     */
    async check() {
        this.logger.verbose('Performing health check...');
        return this.health.check([
            () => this.prismaHealth.isHealthy(),
            // The service is considered unhealthy if heap memory usage exceeds the configured threshold.
            () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),
        ]);
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        prisma_health_indicator_1.PrismaHealthIndicator,
        terminus_1.MemoryHealthIndicator,
        config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map