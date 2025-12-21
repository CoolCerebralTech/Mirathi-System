import { Logger } from '@nestjs/common';
import { CommandBus, EventBus, ICommand } from '@nestjs/cqrs';

import { DomainException } from '../../../../domain/exceptions/domain.exception';
import { Result } from '../../../common/base/result';

/**
 * Base class for all command handlers.
 * DOES NOT implement ICommandHandler (TS limitation).
 */
export abstract class BaseCommandHandler<TCommand extends ICommand, TResult = void> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly eventBus: EventBus, // ✅ inject EventBus for domain events
  ) {}

  abstract execute(command: TCommand): Promise<TResult>;

  protected validateCommand(command: TCommand): Result<void> {
    if (!command) {
      return Result.fail(new Error('Command is required'));
    }
    return Result.ok();
  }

  protected async publishDomainEvents(aggregate: {
    getDomainEvents(): readonly any[];
    clearDomainEvents(): void;
  }): Promise<void> {
    const events = aggregate.getDomainEvents();

    for (const event of events) {
      await this.eventBus.publish(event); // ✅ use EventBus, not CommandBus
    }

    aggregate.clearDomainEvents();
  }

  protected logSuccess(command: TCommand, result?: TResult, context?: string): void {
    this.logger.log({
      message: 'Command executed successfully',
      command: command?.constructor?.name,
      context,
      resultType: result?.constructor?.name,
    });
  }

  protected handleError(error: unknown, command: TCommand, context?: string): never {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error({
      message: 'Command execution failed',
      error: err.message,
      command: command?.constructor?.name,
      context,
      stack: err.stack,
    });

    if (error instanceof DomainException) {
      throw error;
    }

    throw new DomainException(err.message, 'COMMAND_EXECUTION_ERROR', {
      command: command?.constructor?.name,
      context,
    });
  }
}
