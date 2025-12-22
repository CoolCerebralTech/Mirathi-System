// application/guardianship/queries/handlers/base.query-handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { IQuery } from '../../../../common/interfaces/use-case.interface';
import { Result } from '../../../common/base/result';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

/**
 * Base class for all query handlers.
 */
@Injectable()
export abstract class BaseQueryHandler<TQuery extends IQuery, TResult = void> {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(query: TQuery): Promise<Result<TResult>>;

  protected validateQuery(query: TQuery): Result<void> {
    if (!query) {
      return Result.fail(new Error('Query is required'));
    }
    return Result.ok();
  }

  protected logQueryExecution(query: TQuery, context?: string): void {
    this.logger.log({
      message: 'Query execution started',
      query: query?.constructor?.name,
      queryId: query.queryId,
      correlationId: (query as any)?.correlationId,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  protected logQuerySuccess(
    query: TQuery,
    resultCount?: number,
    context?: string,
  ): void {
    this.logger.log({
      message: 'Query executed successfully',
      query: query?.constructor?.name,
      queryId: query.queryId,
      correlationId: (query as any)?.correlationId,
      resultCount,
      context,
      executionTime: new Date(),
    });
  }

  protected logComplianceCheck(
    guardianshipId: string,
    complianceStatus: {
      s72Compliant: boolean;
      s73Compliant: boolean;
      overallCompliant: boolean;
      issues: string[];
    },
    context?: string,
  ): void {
    if (!complianceStatus.overallCompliant) {
      this.logger.warn({
        message: 'Compliance issues detected',
        guardianshipId,
        ...complianceStatus,
        context,
      });
    }
  }

  protected buildPaginationMetadata(
    total: number,
    page: number,
    limit: number,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  protected handleError(error: unknown, query: TQuery, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Query execution failed',
      error: err.message,
      query: query?.constructor?.name,
      queryId: query.queryId,
      correlationId: (query as any)?.correlationId,
      context,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof DomainException) {
      throw error;
    }

    throw new DomainException(err.message, 'QUERY_EXECUTION_ERROR', {
      query: query?.constructor?.name,
      queryId: query.queryId,
      correlationId: (query as any)?.correlationId,
      context,
    });
  }
}