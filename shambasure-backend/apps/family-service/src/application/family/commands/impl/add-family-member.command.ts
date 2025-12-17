// application/family/commands/impl/add-family-member.command.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { AddFamilyMemberRequest } from '../../dto/request/add-family-member.request';
import { BaseCommand } from '../base.command';

export class AddFamilyMemberCommand extends BaseCommand {
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
    description: 'Family ID to add member to',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Family member creation data',
    type: AddFamilyMemberRequest,
  })
  @ValidateNested()
  readonly data: AddFamilyMemberRequest;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    data: AddFamilyMemberRequest,
    correlationId?: string,
  ) {
    super();
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.data = data;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    data: AddFamilyMemberRequest,
    correlationId?: string,
  ): AddFamilyMemberCommand {
    return new AddFamilyMemberCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      data,
      correlationId,
    );
  }
}
