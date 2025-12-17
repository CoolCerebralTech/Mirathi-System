// application/family/queries/handlers/base.query-handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryBus } from '@nestjs/cqrs';

import { Result } from '../../../common/base/result';

export abstract class BaseQueryHandler<Query, Response> implements IQueryHandler<Query> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly queryBus: QueryBus) {}

  abstract execute(query: Query): Promise<Response>;

  protected handleError(error: any, query: Query, context?: string): never {
    this.logger.error({
      message: `Query execution failed: ${error.message}`,
      query: query.constructor.name,
      queryId: (query as any).queryId,
      correlationId: (query as any).correlationId,
      userId: (query as any).userId,
      context,
      stack: error.stack,
    });

    if (error.name === 'DomainException') {
      throw error;
    }

    throw new Error(`Query execution failed: ${error.message}`);
  }

  protected logSuccess(query: Query, result: any, context?: string): void {
    this.logger.log({
      message: 'Query executed successfully',
      query: query.constructor.name,
      queryId: (query as any).queryId,
      correlationId: (query as any).correlationId,
      userId: (query as any).userId,
      resultType: result?.constructor?.name,
      context,
    });
  }

  protected validateQuery(query: Query): Result<void> {
    if (!query) {
      return Result.fail('Query is required');
    }

    if (!(query as any).queryId) {
      return Result.fail('Query ID is required');
    }

    if (!(query as any).userId) {
      return Result.fail('User ID is required');
    }

    return Result.ok();
  }
}
