import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

import { RecordDeathRequest } from '../../dto/request/record-death.request';
import { BaseCommand } from '../base.command';

export class MarkMemberDeceasedCommand extends BaseCommand {
  @ApiProperty({ description: 'Unique command identifier', example: 'cmd-1234567890' })
  @IsUUID('4')
  readonly commandId: string;

  @ApiProperty({ description: 'Command timestamp' })
  @IsNotEmpty()
  readonly timestamp: Date;

  @ApiProperty({ description: 'User ID executing the command' })
  @IsUUID('4')
  readonly userId: string;

  @ApiProperty({ description: 'Family ID' })
  @IsString()
  readonly familyId: string;

  @ApiProperty({ description: 'Member ID' })
  @IsUUID('4')
  readonly memberId: string;

  @ApiProperty({ description: 'Death Record Data', type: RecordDeathRequest })
  @ValidateNested()
  @Type(() => RecordDeathRequest)
  readonly data: RecordDeathRequest;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    memberId: string,
    data: RecordDeathRequest,
    correlationId?: string,
  ) {
    super(correlationId);
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.memberId = memberId;
    this.data = data;
  }

  static create(
    userId: string,
    familyId: string,
    memberId: string,
    data: RecordDeathRequest,
    correlationId?: string,
  ): MarkMemberDeceasedCommand {
    return new MarkMemberDeceasedCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      memberId,
      data,
      correlationId,
    );
  }
}
