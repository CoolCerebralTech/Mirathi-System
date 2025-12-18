// application/family/commands/impl/create-family.command.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';

import { CreateFamilyRequest } from '../../dto/request/create-family.request';
import { BaseCommand } from '../base.command';

export class CreateFamilyCommand extends BaseCommand {
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
    description: 'User ID executing the command',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  readonly userId: string;

  @ApiProperty({
    description: 'Family creation data',
    type: CreateFamilyRequest,
  })
  @ValidateNested()
  @Type(() => CreateFamilyRequest)
  readonly data: CreateFamilyRequest;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    data: CreateFamilyRequest,
    correlationId?: string,
  ) {
    super(correlationId); // Pass correlationId to base constructor
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.data = data;
    // REMOVED: this.correlationId = correlationId;
  }

  static create(
    userId: string,
    data: CreateFamilyRequest,
    correlationId?: string,
  ): CreateFamilyCommand {
    return new CreateFamilyCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      data,
      correlationId,
    );
  }
}
