"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ObservabilityModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const config_1 = require("../../config/src");
const health_module_1 = require("./health/health.module");
const metrics_module_1 = require("./metrics/metrics.module");
const tracing_module_1 = require("./tracing/tracing.module");
const health_service_1 = require("./health/health.service");
// ============================================================================
// Shamba Sure - Shared Observability Module
// ============================================================================
// This is the single, centralized module for all observability features.
// It uses a dynamic `register()` method to configure all sub-modules
// (Logging, Tracing, Metrics, Health) for a specific microservice.
//
// By importing this one module into the root of each service, we guarantee
// that observability is handled consistently and robustly everywhere.
// ============================================================================
let ObservabilityModule = ObservabilityModule_1 = class ObservabilityModule {
    /**
     * Configures and registers all observability features for a service.
     * @param config An object containing the service's name and version.
     */
    static register(config) {
        return {
            module: ObservabilityModule_1,
            imports: [
                // --- 1. HEALTH MODULE ---
                // Provides the /health endpoints via the HealthService.
                health_module_1.HealthModule,
                // --- 2. METRICS MODULE ---
                // Configures Prometheus metrics with the correct service name.
                metrics_module_1.MetricsModule.register(config),
                // --- 3. TRACING MODULE ---
                // Initializes and starts the OpenTelemetry SDK.
                tracing_module_1.TracingModule.register(config),
                // --- 4. LOGGER MODULE ---
                // Configures the nestjs-pino logger as the application's default.
                nestjs_pino_1.LoggerModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => {
                        const isProduction = configService.isProduction;
                        return {
                            pinoHttp: {
                                transport: !isProduction
                                    ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                                    : undefined,
                                level: configService.get('LOG_LEVEL'),
                                // Define the base shape of all logs
                                base: {
                                    service: config.serviceName,
                                    version: config.version,
                                },
                                // Redact sensitive info
                                redact: {
                                    paths: [
                                        'req.headers.authorization',
                                        '*.password',
                                        '*.token',
                                    ],
                                    censor: '***REDACTED***',
                                },
                                // Generate a request ID for correlation
                                genReqId: (req, res) => {
                                    const id = require('crypto').randomUUID();
                                    res.setHeader('x-request-id', id);
                                    return id;
                                },
                            },
                        };
                    },
                }),
            ],
            // We only need to export the HealthService, as it's the only one
            // that needs to be explicitly injected into a controller to create an endpoint.
            // The other services/modules work automatically in the background.
            exports: [health_service_1.HealthService],
        };
    }
};
exports.ObservabilityModule = ObservabilityModule;
exports.ObservabilityModule = ObservabilityModule = ObservabilityModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], ObservabilityModule);
//# sourceMappingURL=observability.module.js.map