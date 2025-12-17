// application/family/commands/impl/mark-member-deceased.command.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class MarkMemberDeceasedCommand extends BaseCommand {
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
    description: 'Family member ID to mark as deceased',
    example: 'fm-1234567890',
  })
  @IsString()
  readonly memberId: string;

  @ApiProperty({
    description: 'Family ID for validation',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Date of death',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  readonly dateOfDeath: Date;

  @ApiProperty({
    description: 'Place of death',
    example: 'Kenyatta National Hospital, Nairobi',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly placeOfDeath?: string;

  @ApiProperty({
    description: 'Death certificate number',
    example: 'DC/2024/12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly deathCertificateNumber?: string;

  @ApiProperty({
    description: 'Cause of death',
    example: 'Cardiac Arrest',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly causeOfDeath?: string;

  @ApiProperty({
    description: 'Issuing authority for death certificate',
    example: 'Civil Registry Nairobi',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly issuingAuthority?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    memberId: string,
    familyId: string,
    dateOfDeath: Date,
    placeOfDeath?: string,
    deathCertificateNumber?: string,
    causeOfDeath?: string,
    issuingAuthority?: string,
    correlationId?: string,
  ) {
    super();
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.memberId = memberId;
    this.familyId = familyId;
    this.dateOfDeath = dateOfDeath;
    this.placeOfDeath = placeOfDeath;
    this.deathCertificateNumber = deathCertificateNumber;
    this.causeOfDeath = causeOfDeath;
    this.issuingAuthority = issuingAuthority;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    memberId: string,
    familyId: string,
    dateOfDeath: Date,
    placeOfDeath?: string,
    deathCertificateNumber?: string,
    causeOfDeath?: string,
    issuingAuthority?: string,
    correlationId?: string,
  ): MarkMemberDeceasedCommand {
    return new MarkMemberDeceasedCommand(
      `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      memberId,
      familyId,
      dateOfDeath,
      placeOfDeath,
      deathCertificateNumber,
      causeOfDeath,
      issuingAuthority,
      correlationId,
    );
  }
}
