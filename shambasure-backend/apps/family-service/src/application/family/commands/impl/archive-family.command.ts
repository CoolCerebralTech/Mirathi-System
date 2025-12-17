// application/family/commands/impl/archive-family.command.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class ArchiveFamilyCommand extends BaseCommand {
  @ApiProperty({
    description: 'Unique command identifier',
    example: 'cmd-1234567890',
  })
  @IsUUID('4')
  readonly commandId: string;

  @ApiProperty({
    description: 'Command timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'Correlation ID for tracing',
    example: 'corr-1234567890',
  })
  @IsUUID('4')
  readonly correlationId?: string;

  @ApiProperty({
    description: 'User ID executing the command',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  readonly userId: string;

  @ApiProperty({
    description: 'Family ID to archive',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Reason for archiving',
    example: 'All family members deceased',
  })
  @IsString()
  readonly reason: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    reason: string,
    correlationId?: string,
  ) {
    super();
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.reason = reason;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    reason: string,
    correlationId?: string,
  ): ArchiveFamilyCommand {
    return new ArchiveFamilyCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      reason,
      correlationId,
    );
  }
}
