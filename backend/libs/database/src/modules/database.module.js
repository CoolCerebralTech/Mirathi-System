"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const terminus_1 = require("@nestjs/terminus");
const prisma_service_1 = require("../services/prisma.service");
const database_service_1 = require("../services/database.service");
const health_service_1 = require("../services/health.service");
const prisma_health_indicator_1 = require("../indicators/prisma-health.indicator");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            // TerminusModule is required for the health check infrastructure
            terminus_1.TerminusModule.forRoot({
                errorLogStyle: 'pretty',
            }),
        ],
        providers: [
            prisma_service_1.PrismaService,
            database_service_1.DatabaseService,
            health_service_1.HealthService,
            prisma_health_indicator_1.PrismaHealthIndicator,
        ],
        exports: [
            prisma_service_1.PrismaService,
            database_service_1.DatabaseService,
            health_service_1.HealthService, // Export the HealthService so other modules can use it
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map