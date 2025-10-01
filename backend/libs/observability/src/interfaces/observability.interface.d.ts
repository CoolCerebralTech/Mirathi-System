import { HealthCheckResult, HealthStatus } from '@shamba/database';
/**
 * The context for distributed tracing, compliant with standards like W3C Trace Context.
 * This is the core information passed between services to link operations together.
 */
export interface TraceContext {
    /** A unique ID representing the entire end-to-end request flow. */
    traceId: string;
    /** A unique ID representing a single operation or step within a trace. */
    spanId: string;
}
/**
 * Defines the standardized context to be included in every structured log entry.
 * It combines trace information with application-specific context.
 */
export interface LogContext extends Partial<TraceContext> {
    /** A unique ID for correlating events within a single request flow. */
    correlationId?: string;
    /** The ID of the authenticated user performing the action, if available. */
    userId?: string;
    /** The name of the microservice generating the log. */
    serviceName: string;
}
/**
 * Defines the contract for creating a new Prometheus metric.
 */
export interface MetricDefinition {
    /** The name of the metric (e.g., `http_requests_total`). */
    name: string;
    /** The help text describing what the metric measures. */
    help: string;
    /** An array of label names for this metric (e.g., ['method', 'path', 'status_code']). */
    labelNames: string[];
}
/**
 * Re-exporting health check types for convenience, as health is a key
 * part of observability. This makes `@shamba/observability` a single
 * point of import for all monitoring-related types.
 */
export { HealthCheckResult, HealthStatus };
//# sourceMappingURL=observability.interface.d.ts.map