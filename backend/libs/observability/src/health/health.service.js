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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const database_1 = require("../../../database/src");
const config_1 = require("../../../config/src");
const messaging_health_indicator_1 = require("./messaging-health.indicator");
let HealthService = class HealthService {
    health;
    memory;
    prismaHealth;
    messagingHealth;
    configService;
    memoryHeapThreshold;
    constructor(health, memory, prismaHealth, messagingHealth, configService) {
        this.health = health;
        this.memory = memory;
        this.prismaHealth = prismaHealth;
        this.messagingHealth = messagingHealth;
        this.configService = configService;
        // --- THE FIX IS HERE ---
        // We get the threshold from our type-safe ConfigService. Our Joi schema
        // is responsible for providing the default value if it's not in the .env file.
        const thresholdInMb = this.configService.get('HEALTH_MEMORY_HEAP_THRESHOLD_MB');
        this.memoryHeapThreshold = thresholdInMb * 1024 * 1024;
        // -----------------------
    }
    /**
     * Performs a readiness check, verifying all critical downstream dependencies.
     * This should be used for Kubernetes readiness probes.
     */
    async checkReadiness() {
        return this.health.check([
            () => this.prismaHealth.isHealthy(),
            () => this.messagingHealth.isHealthy(),
            () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),
        ]);
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.MemoryHealthIndicator,
        database_1.PrismaHealthIndicator,
        messaging_health_indicator_1.MessagingHealthIndicator,
        config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map