import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Result } from '../../../common/base/result';
import { IQuery, IQueryHandler } from '../../../common/interfaces/use-case.interface';

export abstract class BaseQueryHandler<TQuery extends IQuery, TResult> implements IQueryHandler<
  TQuery,
  TResult
> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly queryBus: QueryBus) {} // ✅ accept QueryBus

  abstract execute(query: TQuery): Promise<Result<TResult>>;

  protected validateQuery(query: TQuery): Result<void> {
    if (!query) {
      return Result.fail(new Error('Query is required'));
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

  protected handleError(error: unknown, query: TQuery, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Query execution failed',
      error: err.message,
      query: query?.constructor?.name,
      context,
      stack: err.stack,
    });

    throw err;
  }
}
