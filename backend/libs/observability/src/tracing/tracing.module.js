"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TracingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingModule = void 0;
const common_1 = require("@nestjs/common");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const tracing_service_1 = require("./tracing.service");
let sdk; // Keep a global reference to the SDK for shutdown
let TracingModule = class TracingModule {
    static { TracingModule_1 = this; }
    static logger = new common_1.Logger('TracingModule');
    /**
     * Configures and initializes the OpenTelemetry SDK for the application.
     * This should be imported once in the root module of each microservice.
     */
    static register(config) {
        // --- The complex setup logic now lives here ---
        const traceExporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
        // The OTLP endpoint is the standard for modern observability backends (Jaeger, Grafana Tempo, etc.)
        // It should be configured via environment variables.
        // url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317'
        });
        sdk = new sdk_node_1.NodeSDK({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: config.version,
            }),
            traceExporter,
            // This is magic: it automatically instruments popular libraries like
            // NestJS (http), Prisma, RabbitMQ (amqplib), etc.
            instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
        });
        // Start the SDK.
        // We wrap this in a try/catch to prevent a tracing setup failure
        // from crashing the entire application during startup.
        try {
            sdk.start();
            this.logger.log('OpenTelemetry Tracing SDK started successfully.');
        }
        catch (error) {
            this.logger.error('Failed to start OpenTelemetry Tracing SDK.', error);
        }
        return {
            module: TracingModule_1,
            providers: [tracing_service_1.TracingService],
            exports: [tracing_service_1.TracingService],
        };
    }
    /**
     * Gracefully shuts down the SDK when the NestJS application closes.
     */
    async onApplicationShutdown(signal) {
        if (sdk) {
            try {
                await sdk.shutdown();
                TracingModule_1.logger.log('OpenTelemetry Tracing SDK shut down successfully.');
            }
            catch (error) {
                TracingModule_1.logger.error('Failed to shut down Tracing SDK.', error);
            }
        }
    }
};
exports.TracingModule = TracingModule;
exports.TracingModule = TracingModule = TracingModule_1 = __decorate([
    (0, common_1.Module)({
        providers: [tracing_service_1.TracingService],
        exports: [tracing_service_1.TracingService],
    })
], TracingModule);
//# sourceMappingURL=tracing.module.js.map