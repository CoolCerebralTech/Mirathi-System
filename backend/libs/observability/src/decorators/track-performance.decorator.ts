import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { MetricsService } from '../metrics/metrics.service';

export function TrackPerformance(operation?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;
    const operationName = operation || `${className}.${methodName}`;

    descriptor.value = async function (...args: any[]) {
      const logger: LoggerService = (this as any).logger;
      const metrics: MetricsService = (this as any).metricsService;
      
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Log performance
        if (logger) {
          logger.performanceEvent(operationName, duration, {
            class: className,
            method: methodName,
            args: args.length,
          });
        }

        // Record metric
        if (metrics) {
          metrics.recordBusinessMetric('method_execution_duration', duration, {
            operation: operationName,
            class: className,
            method: methodName,
          });
        }

        // Warn if too slow
        if (duration > 1000) {
          logger?.warn(`Slow operation: ${operationName} took ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Log error with performance
        logger?.error(`Operation failed: ${operationName}`, 'performance', {
          duration,
          error: error.message,
          class: className,
          method: methodName,
        });

        throw error;
      }
    };

    return descriptor;
  };
}