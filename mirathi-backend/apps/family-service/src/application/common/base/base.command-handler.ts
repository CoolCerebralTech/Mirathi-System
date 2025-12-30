import { Logger } from '@nestjs/common';
import { EventBus, ICommand } from '@nestjs/cqrs';

import { AggregateRoot } from '../../../domain/base/aggregate-root';
import { DomainException } from '../../../domain/exceptions/domain.exception';

export interface AggregateRepository<TAggregate extends AggregateRoot<any>> {
  findById(id: string): Promise<TAggregate | null>;
  // ✅ Return the persisted aggregate
  save(aggregate: TAggregate, expectedVersion?: number): Promise<TAggregate>;
}

export interface IdempotencyStore {
  has(commandId: string): Promise<boolean>;
  record(commandId: string, metadata?: Record<string, unknown>): Promise<void>;
}

export abstract class BaseCommandHandler<
  TCommand extends ICommand & { correlationId?: string; userId?: string; commandId?: string },
  TAggregate extends AggregateRoot<any>,
  TResult = void,
> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: AggregateRepository<TAggregate>,
    protected readonly idempotency?: IdempotencyStore,
  ) {}

  abstract execute(command: TCommand): Promise<TResult>;

  protected async run(
    command: TCommand,
    aggregateId: string,
    mutate: (aggregate: TAggregate) => Promise<void> | void,
    expectedVersion?: number,
  ): Promise<void> {
    try {
      await this.ensureIdempotent(command);

      const aggregate = await this.loadAggregateOrThrow(aggregateId);

      if (typeof expectedVersion === 'number') {
        aggregate.checkVersion(expectedVersion);
      }

      await Promise.resolve(mutate(aggregate));

      aggregate.validate();

      // ✅ save returns the aggregate
      await this.repository.save(aggregate, aggregate.getVersion());

      this.publishEventsAndCommit(aggregate);

      this.logSuccess(command);
    } catch (error) {
      this.handleError(error, command);
    }
  }

  protected async loadAggregateOrThrow(aggregateId: string): Promise<TAggregate> {
    const aggregate = await this.repository.findById(aggregateId);
    if (!aggregate) {
      throw new DomainException(`Aggregate not found: ${aggregateId}`, 'AGGREGATE_NOT_FOUND', {
        aggregateId,
      });
    }
    return aggregate;
  }

  protected publishEventsAndCommit(aggregate: AggregateRoot<any>): void {
    const events = [...aggregate.getUncommittedEvents()]; // clone to mutable

    if (events.length > 0) {
      this.logger.debug(`Publishing ${events.length} domain event(s)`);

      for (const event of events) {
        (event as any).aggregateType = aggregate.getAggregateType?.() ?? aggregate.constructor.name;
        (event as any).aggregateId = (aggregate as any).id?.toString?.();
      }

      this.eventBus.publishAll(events);
    }

    aggregate.clearEvents();
  }

  protected async ensureIdempotent(command: TCommand): Promise<void> {
    if (!this.idempotency) return;

    const key = command.commandId ?? command.correlationId;
    if (!key) return;

    const exists = await this.idempotency.has(key);
    if (exists) {
      this.logger.warn({
        message: 'Duplicate command detected; short-circuiting',
        command: command.constructor.name,
        key,
      });
      throw new DomainException('Duplicate command', 'IDEMPOTENT_DUPLICATE', { key });
    }

    await this.idempotency.record(key, {
      command: command.constructor.name,
      userId: command.userId,
      correlationId: command.correlationId,
    });
  }

  protected logSuccess(command: TCommand, context?: string): void {
    this.logger.log({
      message: 'Command executed successfully',
      command: command.constructor.name,
      correlationId: command.correlationId,
      userId: command.userId,
      context,
    });
  }

  protected handleError(error: unknown, command: TCommand, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Command execution failed',
      error: err.message,
      command: command.constructor.name,
      correlationId: command.correlationId,
      context,
      stack: err.stack,
    });

    if (error instanceof DomainException) {
      throw error;
    }

    throw new DomainException(err.message, 'SYSTEM_ERROR', {
      command: command.constructor.name,
      context,
    });
  }
}
