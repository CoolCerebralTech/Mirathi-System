// application/family/commands/base.command.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export abstract class BaseCommand {
  abstract readonly commandId: string;
  abstract readonly timestamp: Date;
  abstract readonly userId: string;

  @ApiPropertyOptional({
    description: 'Correlation ID for distributed tracing',
    example: 'corr-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  readonly correlationId?: string;

  // Add a constructor that properly initializes correlationId for readonly property
  constructor(correlationId?: string) {
    if (correlationId) {
      // This bypasses the readonly restriction in constructor
      (this as any).correlationId = correlationId;
    }
  }
}
