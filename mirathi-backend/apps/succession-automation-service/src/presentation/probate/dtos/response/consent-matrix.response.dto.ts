import { ApiProperty } from '@nestjs/swagger';

import {
  ConsentMethod,
  ConsentStatus,
  FamilyRole,
} from '../../../../domain/entities/family-consent.entity';

export class ConsentItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  familyMemberId: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ enum: FamilyRole, example: FamilyRole.ADULT_CHILD })
  role: FamilyRole;

  @ApiProperty({ example: 'Daughter' })
  relationship: string;

  @ApiProperty({ enum: ConsentStatus, example: ConsentStatus.PENDING })
  status: ConsentStatus;

  @ApiProperty({ example: true })
  isRequired: boolean;

  @ApiProperty({ example: true })
  hasPhone: boolean;

  @ApiProperty({ example: true })
  hasEmail: boolean;

  @ApiProperty({ required: false })
  requestSentAt?: Date;

  @ApiProperty({ required: false })
  respondedAt?: Date;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty({ required: false, enum: ConsentMethod })
  method?: ConsentMethod;

  @ApiProperty({ required: false })
  declineReason?: string;

  @ApiProperty({ example: true })
  canSendRequest: boolean;

  @ApiProperty({ example: true })
  canMarkNotRequired: boolean;
}

export class ConsentMatrixResponseDto {
  @ApiProperty()
  applicationId: string;

  @ApiProperty({ example: 4 })
  totalRequired: number;

  @ApiProperty({ example: 2 })
  received: number;

  @ApiProperty({ example: 1 })
  pending: number;

  @ApiProperty({ example: 0 })
  declined: number;

  @ApiProperty({ example: false })
  isComplete: boolean;

  @ApiProperty({ type: [ConsentItemResponseDto] })
  items: ConsentItemResponseDto[];
}
