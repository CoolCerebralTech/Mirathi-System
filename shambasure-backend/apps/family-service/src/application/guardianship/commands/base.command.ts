// application/guardianship/commands/base.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export abstract class BaseCommand {
  @ApiProperty({
    description: 'Unique command identifier for tracing',
    example: 'cmd-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly commandId: string;

  @ApiProperty({
    description: 'Timestamp when command was issued',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'User ID who issued the command',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly userId: string;

  @ApiPropertyOptional({
    description: 'Correlation ID for distributed tracing',
    example: 'corr-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  readonly correlationId?: string;

  constructor(commandId: string, timestamp: Date, userId: string, correlationId?: string) {
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.correlationId = correlationId;
  }

  /**
   * Abstract method to get command name for logging and auditing
   */
  abstract getCommandName(): string;
}
