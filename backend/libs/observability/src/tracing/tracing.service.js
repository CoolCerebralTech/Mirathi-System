"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingService = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
// ============================================================================
// ARCHITECTURAL NOTE:
// This service provides a simple, high-level API for interacting with the
// active OpenTelemetry trace context.
//
// The complex setup and initialization of the OpenTelemetry SDK is handled
// separately and automatically by the `TracingModule`. This service assumes
// that tracing has already been initialized if it is enabled.
// ============================================================================
let TracingService = class TracingService {
    /**
     * Retrieves the current active trace context.
     * This is the essential method for linking logs and events together in a
     * distributed trace.
     *
     * @returns The current TraceContext, or null if no active trace is found.
     */
    getContext() {
        // We use the official OpenTelemetry API to get the current span context.
        const spanContext = api_1.trace.getSpanContext(api_1.context.active());
        // If there's no active span, we're not in a traced request.
        if (!spanContext) {
            return null;
        }
        return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
        };
    }
};
exports.TracingService = TracingService;
exports.TracingService = TracingService = __decorate([
    (0, common_1.Injectable)()
], TracingService);
//# sourceMappingURL=tracing.service.js.map