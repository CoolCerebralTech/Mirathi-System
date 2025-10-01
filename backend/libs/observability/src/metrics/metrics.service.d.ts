import { Registry, Counter, Gauge, Histogram } from 'prom-client';
import { MetricDefinition } from '../interfaces/observability.interface';
export declare class MetricsService {
    private readonly registry;
    constructor(registry: Registry);
    /**
     * Creates and registers a new Counter metric.
     * @param definition The metric's name, help text, and labels.
     * @returns The created Counter instance.
     */
    createCounter(definition: MetricDefinition): Counter;
    /**
     * Creates and registers a new Gauge metric.
     * @param definition The metric's name, help text, and labels.
     * @returns The created Gauge instance.
     */
    createGauge(definition: MetricDefinition): Gauge;
    /**
     * Creates and registers a new Histogram metric.
     * @param definition The metric's name, help text, and labels.
     * @param buckets Optional histogram buckets.
     * @returns The created Histogram instance.
     */
    createHistogram(definition: MetricDefinition, buckets?: number[]): Histogram;
    /**
     * Returns the full metrics payload for the /metrics endpoint.
     */
    getMetrics(): Promise<string>;
}
//# sourceMappingURL=metrics.service.d.ts.map