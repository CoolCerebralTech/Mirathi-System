// application/dependency/commands/handlers/base.handler.ts
import { Logger } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { BaseCommand, CommandMetadata } from '../base.command';

export interface CommandHandlerResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  warnings?: string[];
  commandId: string;
  timestamp: Date;
}

export abstract class BaseCommandHandler<TCommand extends BaseCommand> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly repository: ILegalDependantRepository,
    protected readonly eventPublisher: EventPublisher,
  ) {}

  abstract execute(command: TCommand): Promise<CommandHandlerResult>;

  protected async beginTransaction(): Promise<void> {
    // Implement transaction logic if needed
    this.logger.debug('Transaction started');
  }

  protected async commitTransaction(): Promise<void> {
    // Implement commit logic if needed
    this.logger.debug('Transaction committed');
  }

  protected async rollbackTransaction(error: Error): Promise<void> {
    // Implement rollback logic if needed
    this.logger.error('Transaction rolled back', error.stack);
  }

  protected validateMetadata(metadata: CommandMetadata): void {
    if (!metadata.userId) {
      throw new Error('User ID is required in command metadata');
    }

    if (!metadata.userRole) {
      throw new Error('User role is required in command metadata');
    }

    // Additional metadata validation can be added here
  }

  protected logCommandExecution(
    command: TCommand,
    duration: number,
    success: boolean,
    error?: Error,
  ): void {
    const logEntry = {
      commandId: command.commandId,
      commandType: command.commandType,
      correlationId: command.correlationId,
      userId: command.metadata?.userId,
      userRole: command.metadata?.userRole,
      durationMs: duration,
      success,
      error: error?.message,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      this.logger.log('Command executed successfully', logEntry);
    } else {
      this.logger.error('Command execution failed', error?.stack, logEntry);
    }
  }

  protected createSuccessResult<T>(
    data: T,
    message: string,
    command: TCommand,
    warnings?: string[],
  ): CommandHandlerResult<T> {
    return {
      success: true,
      data,
      message,
      warnings,
      commandId: command.commandId,
      timestamp: new Date(),
    };
  }

  protected createErrorResult(
    message: string,
    command: TCommand,
    errors: string[],
    warnings?: string[],
  ): CommandHandlerResult {
    return {
      success: false,
      message,
      errors,
      warnings,
      commandId: command.commandId,
      timestamp: new Date(),
    };
  }

  // Helper to check if user has required role
  protected hasRequiredRole(metadata: CommandMetadata, requiredRoles: string[]): boolean {
    return requiredRoles.includes(metadata.userRole);
  }

  // Helper to check if user has permission for specific operation
  protected checkPermission(
    metadata: CommandMetadata,
    operation: string,
  ): { hasPermission: boolean; reason?: string } {
    // Implement permission logic based on user role and operation
    // This can be extended based on your authorization requirements

    const courtRoles = ['JUDGE', 'REGISTRAR', 'COURT_CLERK'];
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    const userRoles = ['LAWYER', 'CLAIMANT', 'FAMILY_MEMBER'];

    // Example permission matrix
    const permissions: Record<string, string[]> = {
      CREATE_DEPENDENCY: [...adminRoles, ...courtRoles, ...userRoles],
      ASSESS_FINANCIAL: [...adminRoles, ...courtRoles, 'EXPERT_ASSESSOR'],
      FILE_S26_CLAIM: [...adminRoles, ...courtRoles, 'LAWYER', 'CLAIMANT'],
      RECORD_COURT_PROVISION: [...adminRoles, ...courtRoles],
    };

    const allowedRoles = permissions[operation] || [];
    const hasPermission = allowedRoles.includes(metadata.userRole);

    return {
      hasPermission,
      reason: hasPermission ? undefined : `Role ${metadata.userRole} not allowed for ${operation}`,
    };
  }
}
