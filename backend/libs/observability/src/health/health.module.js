"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthModule = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const health_service_1 = require("./health.service");
const messaging_health_indicator_1 = require("./messaging-health.indicator");
// The PrismaHealthIndicator is provided by the DatabaseModule, which should be
// imported in the root module of the microservice. We don't need to re-provide it here.
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // TerminusModule is the foundation for all health checks.
            terminus_1.TerminusModule,
        ],
        providers: [
            health_service_1.HealthService,
            messaging_health_indicator_1.MessagingHealthIndicator,
        ],
        exports: [health_service_1.HealthService], // We export the service for use in controllers.
    })
], HealthModule);
//# sourceMappingURL=health.module.js.map