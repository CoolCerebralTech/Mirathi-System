import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Result } from '../../../common/base/result';
import { IQuery } from '../../../common/interfaces/use-case.interface';

// Removed 'implements IQueryHandler' to fix TS2422 conditional type error
export abstract class BaseQueryHandler<TQuery extends IQuery, TResult> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly queryBus: QueryBus) {}

  abstract execute(query: TQuery): Promise<Result<TResult>>;

  protected validateQuery(query: TQuery): Result<void> {
    if (!query) {
      return Result.fail(new Error('Query is required'));
    }
    if (typeof (query as any).validate === 'function') {
      const validation = (query as any).validate();
      if (!validation.isValid) {
        return Result.fail(new Error(validation.errors.join(', ')));
      }
    }
    return Result.ok();
  }

  protected logSuccess(query: TQuery, result?: TResult, context?: string): void {
    this.logger.log({
      message: 'Query executed successfully',
      query: query?.constructor?.name,
      context,
      resultType: result?.constructor?.name,
    });
  }

  protected handleError(error: unknown, _query: TQuery, context?: string): Result<TResult> {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Query execution failed',
      error: err.message,
      context,
      stack: err.stack,
    });

    return Result.fail(err);
  }

  protected checkQueryPermissions(
    metadata: { userId: string; userRole?: string },
    _query: TQuery,
  ): { hasPermission: boolean; reason?: string } {
    if (!metadata.userId) {
      return { hasPermission: false, reason: 'User not authenticated' };
    }
    return { hasPermission: true };
  }

  protected async withPerformanceMonitoring<R>(
    operation: () => Promise<R>,
    query: TQuery,
  ): Promise<{ result: R; duration: number }> {
    const start = process.hrtime();
    const result = await operation();
    const end = process.hrtime(start);
    const duration = end[0] * 1000 + end[1] / 1e6;

    if (duration > 500) {
      this.logger.warn(
        `Slow query detected: ${query.constructor.name} took ${duration.toFixed(2)}ms`,
      );
    }

    return { result, duration };
  }
}
