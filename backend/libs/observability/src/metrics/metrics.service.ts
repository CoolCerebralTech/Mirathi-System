import { Injectable } from '@nestjs/common';
import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';
import { MetricDefinition } from '../interfaces/observability.interface';

@Injectable()
export class MetricsService {
  // The central registry is created in the module and injected here.
  constructor(private readonly registry: Registry) {}

  /**
   * Creates and registers a new Counter metric.
   * @param definition The metric's name, help text, and labels.
   * @returns The created Counter instance.
   */
  createCounter(definition: MetricDefinition): Counter {
    const counter = new Counter({
      name: definition.name,
      help: definition.help,
      labelNames: definition.labelNames,
      registers: [this.registry],
    });
    return counter;
  }

  /**
   * Creates and registers a new Gauge metric.
   * @param definition The metric's name, help text, and labels.
   * @returns The created Gauge instance.
   */
  createGauge(definition: MetricDefinition): Gauge {
    const gauge = new Gauge({
      name: definition.name,
      help: definition.help,
      labelNames: definition.labelNames,
      registers: [this.registry],
    });
    return gauge;
  }

  /**
   * Creates and registers a new Histogram metric.
   * @param definition The metric's name, help text, and labels.
   * @param buckets Optional histogram buckets.
   * @returns The created Histogram instance.
   */
  createHistogram(definition: MetricDefinition, buckets?: number[]): Histogram {
    const histogram = new Histogram({
      name: definition.name,
      help: definition.help,
      labelNames: definition.labelNames,
      buckets,
      registers: [this.registry],
    });
    return histogram;
  }

  /**
   * Returns the full metrics payload for the /metrics endpoint.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}