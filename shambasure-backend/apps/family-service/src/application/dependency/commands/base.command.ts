// application/dependency/commands/base.command.ts
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseCommand {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly causationId?: string;

  constructor(correlationId?: string, causationId?: string) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.causationId = causationId;
  }

  abstract get commandType(): string;
}

// Validation result interface
export interface CommandValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Command metadata for audit
export interface CommandMetadata {
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  courtId?: string; // For court-related commands
}
