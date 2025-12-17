// application/family/commands/handlers/base.command-handler.ts
import { Logger } from '@nestjs/common';
import { CommandBus, ICommandHandler } from '@nestjs/cqrs';
import { EventPublisher } from '@nestjs/cqrs';

import { DomainException } from '../../../../domain/exceptions/family.exception';
import { Result } from '../../../common/base/result';

export abstract class BaseCommandHandler<Command, Response> implements ICommandHandler<Command> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly eventPublisher: EventPublisher,
  ) {}

  abstract execute(command: Command): Promise<Response>;

  protected handleError(error: any, command: Command, context?: string): never {
    this.logger.error({
      message: `Command execution failed: ${error.message}`,
      command: command.constructor.name,
      commandId: (command as any).commandId,
      correlationId: (command as any).correlationId,
      userId: (command as any).userId,
      context,
      stack: error.stack,
    });

    if (error instanceof DomainException) {
      throw error;
    }

    // Wrap unexpected errors in a domain exception
    throw new DomainException(
      `Command execution failed: ${error.message}`,
      'COMMAND_EXECUTION_ERROR',
      { command, context },
    );
  }

  protected logSuccess(command: Command, result: any, context?: string): void {
    this.logger.log({
      message: 'Command executed successfully',
      command: command.constructor.name,
      commandId: (command as any).commandId,
      correlationId: (command as any).correlationId,
      userId: (command as any).userId,
      resultType: result?.constructor?.name,
      context,
    });
  }

  protected validateCommand(command: Command): Result<void> {
    // Basic validation - can be extended by specific handlers
    if (!command) {
      return Result.fail('Command is required');
    }

    if (!(command as any).commandId) {
      return Result.fail('Command ID is required');
    }

    if (!(command as any).userId) {
      return Result.fail('User ID is required');
    }

    return Result.ok();
  }
}
