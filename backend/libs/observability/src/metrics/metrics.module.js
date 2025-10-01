"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MetricsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsModule = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
const metrics_service_1 = require("./metrics.service");
let MetricsModule = class MetricsModule {
    static { MetricsModule_1 = this; }
    static logger = new common_1.Logger('MetricsModule');
    /**
     * Configures the shared MetricsModule.
     * This should be imported once in the root module of each microservice.
     */
    static register(config) {
        const registry = new prom_client_1.Registry();
        // Set default labels that will be applied to all metrics
        registry.setDefaultLabels({
            service: config.serviceName,
            version: config.version,
        });
        // Collect default Node.js and process metrics
        (0, prom_client_1.collectDefaultMetrics)({ register: registry });
        const registryProvider = {
            provide: prom_client_1.Registry,
            useValue: registry,
        };
        return {
            module: MetricsModule_1,
            providers: [metrics_service_1.MetricsService, registryProvider],
            exports: [metrics_service_1.MetricsService],
        };
    }
    onModuleInit() {
        MetricsModule_1.logger.log('MetricsModule initialized and collecting default metrics.');
    }
};
exports.MetricsModule = MetricsModule;
exports.MetricsModule = MetricsModule = MetricsModule_1 = __decorate([
    (0, common_1.Module)({})
], MetricsModule);
//# sourceMappingURL=metrics.module.js.map