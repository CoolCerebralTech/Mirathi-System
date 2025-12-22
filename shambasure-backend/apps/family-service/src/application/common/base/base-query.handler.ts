import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { IQuery, IQueryHandler } from '../interfaces/use-case.interface';
import { Result } from './result';

/**
 * Base Query Handler
 * - Validates query input
 * - Executes domain query logic
 * - Wraps results in Result<T>
 * - Logs success/failure with tracing metadata
 */
export abstract class BaseQueryHandler<
  TQuery extends IQuery & { queryId?: string; correlationId?: string; userId?: string },
  TResult,
> implements IQueryHandler<TQuery, TResult> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly queryBus: QueryBus) {}

  /**
   * Concrete handlers implement domain query logic here.
   */
  abstract execute(query: TQuery): Promise<Result<TResult>>;

  /**
   * Guard against null/undefined queries.
   */
  protected validateQuery(query: TQuery): Result<void> {
    if (!query) {
      return Result.fail(new Error('Query is required'));
    }
    return Result.ok();
  }

  /**
   * Log successful query execution.
   */
  protected logSuccess(query: TQuery, result?: TResult, context?: string): void {
    this.logger.log({
      message: 'Query executed successfully',
      query: query?.constructor?.name,
      queryId: (query as any).queryId,
      correlationId: (query as any).correlationId,
      userId: (query as any).userId,
      context,
      resultType: result ? result.constructor?.name : undefined,
    });
  }

  /**
   * Handle and rethrow errors consistently.
   */
  protected handleError(error: unknown, query: TQuery, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Query execution failed',
      error: err.message,
      query: query?.constructor?.name,
      queryId: (query as any).queryId,
      correlationId: (query as any).correlationId,
      context,
      stack: err.stack,
    });

    // Wrap in Result.fail if you want handlers to return Result instead of throwing
    throw err;
  }
}
