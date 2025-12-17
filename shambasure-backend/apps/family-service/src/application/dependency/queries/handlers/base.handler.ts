// application/dependency/queries/handlers/base.handler.ts
import { Logger } from '@nestjs/common';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { BaseQuery, QueryMetadata } from '../base.query';

export interface QueryHandlerResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  warnings?: string[];
  queryId?: string;
  timestamp: Date;
  executionTimeMs: number;
}

export interface PaginatedQueryHandlerResult<T> extends QueryHandlerResult<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export abstract class BaseQueryHandler<TQuery extends BaseQuery, TResult> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly repository: ILegalDependantRepository,
    protected readonly mapper: DependencyMapper,
  ) {}

  abstract execute(query: TQuery): Promise<QueryHandlerResult<TResult>>;

  protected validateQuery(query: TQuery): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    if (!query) {
      return {
        isValid: false,
        errors: ['Query cannot be null or undefined'],
        warnings: [],
      };
    }

    if (typeof query.validate === 'function') {
      return query.validate();
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  protected checkQueryPermissions(
    metadata: QueryMetadata,
    query: TQuery,
  ): { hasPermission: boolean; reason?: string } {
    // Base permission check - can be overridden by specific handlers
    if (!metadata.userId) {
      return {
        hasPermission: false,
        reason: 'User ID is required for query execution',
      };
    }

    // By default, allow all queries - restrict in specific handlers if needed
    return { hasPermission: true };
  }

  protected createSuccessResult<T>(
    data: T,
    message: string,
    query: TQuery,
    warnings?: string[],
    executionTimeMs?: number,
  ): QueryHandlerResult<T> {
    return {
      success: true,
      data,
      message,
      warnings,
      queryId: query.requestId,
      timestamp: new Date(),
      executionTimeMs: executionTimeMs || 0,
    };
  }

  protected createPaginatedSuccessResult<T>(
    data: T[],
    total: number,
    query: any, // Query with page and limit properties
    message: string,
    warnings?: string[],
    executionTimeMs?: number,
  ): PaginatedQueryHandlerResult<T> {
    const totalPages = Math.ceil(total / query.limit);

    return {
      success: true,
      data,
      message,
      warnings,
      queryId: query.requestId,
      timestamp: new Date(),
      executionTimeMs: executionTimeMs || 0,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  protected createErrorResult(
    message: string,
    query: TQuery,
    errors: string[],
    warnings?: string[],
    executionTimeMs?: number,
  ): QueryHandlerResult {
    return {
      success: false,
      message,
      errors,
      warnings,
      queryId: query.requestId,
      timestamp: new Date(),
      executionTimeMs: executionTimeMs || 0,
    };
  }

  protected logQueryExecution(
    query: TQuery,
    duration: number,
    success: boolean,
    error?: Error,
  ): void {
    const logEntry = {
      queryName: query['queryName'] || this.constructor.name,
      queryId: query.requestId,
      correlationId: query.correlationId,
      userId: query.userId,
      userRole: query.userRole,
      durationMs: duration,
      success,
      error: error?.message,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      this.logger.log('Query executed successfully', logEntry);
    } else {
      this.logger.error('Query execution failed', error?.stack, logEntry);
    }
  }

  protected async withPerformanceMonitoring<T>(
    operation: () => Promise<T>,
    query: TQuery,
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        // 1 second
        this.logger.warn(`Slow query detected: ${duration}ms`, {
          queryName: query['queryName'],
          queryId: query.requestId,
          durationMs: duration,
        });
      }

      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw error;
    }
  }

  // Cache helper methods
  protected generateCacheKey(query: TQuery): string {
    const queryString = JSON.stringify(query);
    return `query:${this.constructor.name}:${Buffer.from(queryString).toString('base64')}`;
  }

  protected shouldCache(query: TQuery): boolean {
    // Determine if this query should be cached
    // Cache frequently accessed, expensive queries
    const cacheableQueries = [
      'GetDependencyByIdQuery',
      'ListDependenciesByDeceasedQuery',
      'GetDependencyStatisticsQuery',
    ];

    return cacheableQueries.includes(query['queryName']);
  }

  protected getCacheTTL(query: TQuery): number {
    // Return cache TTL in seconds
    switch (query['queryName']) {
      case 'GetDependencyByIdQuery':
        return 300; // 5 minutes
      case 'GetDependencyStatisticsQuery':
        return 600; // 10 minutes
      case 'ListDependenciesByDeceasedQuery':
        return 180; // 3 minutes
      default:
        return 60; // 1 minute
    }
  }
}
