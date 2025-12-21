import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { UpdateFamilyRequest } from '../../dto/request/update-family.request';
import { BaseCommand } from '../base.command';

export class UpdateFamilyCommand extends BaseCommand {
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
    description: 'Family ID to update',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Family update data',
    type: UpdateFamilyRequest,
  })
  @ValidateNested()
  @Type(() => UpdateFamilyRequest)
  readonly data: UpdateFamilyRequest;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    data: UpdateFamilyRequest,
    correlationId?: string,
  ) {
    super(correlationId);
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.data = data;
  }

  static create(
    userId: string,
    familyId: string,
    data: UpdateFamilyRequest,
    correlationId?: string,
  ): UpdateFamilyCommand {
    return new UpdateFamilyCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      data,
      correlationId,
    );
  }
}
