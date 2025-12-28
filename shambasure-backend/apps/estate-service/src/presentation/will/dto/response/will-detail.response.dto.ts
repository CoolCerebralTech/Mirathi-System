import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

class RevocationDetailsDto {
  @ApiProperty()
  method: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  date: string;
}

class CapacityDeclarationSummaryDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  date: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;

  @ApiProperty()
  isLegallySufficient: boolean;
}

class ExecutorSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  isQualified: boolean;

  @ApiProperty()
  status: string;
}

class BequestSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  beneficiaryName: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  valueSummary: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;
}

class WitnessSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  signedAt?: string;
}

class CodicilSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isExecuted: boolean;
}

class DisinheritanceSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  personName: string;

  @ApiProperty()
  reasonCategory: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;

  @ApiProperty()
  isActive: boolean;
}

export class WillDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testatorId: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty({ enum: WillStatus })
  status: WillStatus;

  @ApiProperty({ enum: WillType })
  type: WillType;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  executionDate?: string;

  @ApiPropertyOptional()
  executionLocation?: string;

  @ApiProperty()
  isRevoked: boolean;

  @ApiPropertyOptional({ type: RevocationDetailsDto })
  revocationDetails?: RevocationDetailsDto;

  @ApiPropertyOptional()
  funeralWishes?: string;

  @ApiPropertyOptional()
  burialLocation?: string;

  @ApiPropertyOptional()
  residuaryClause?: string;

  @ApiPropertyOptional({ type: CapacityDeclarationSummaryDto })
  capacityDeclaration?: CapacityDeclarationSummaryDto;

  @ApiProperty({ type: [ExecutorSummaryDto] })
  executors: ExecutorSummaryDto[];

  @ApiProperty({ type: [BequestSummaryDto] })
  bequests: BequestSummaryDto[];

  @ApiProperty({ type: [WitnessSummaryDto] })
  witnesses: WitnessSummaryDto[];

  @ApiProperty({ type: [CodicilSummaryDto] })
  codicils: CodicilSummaryDto[];

  @ApiProperty({ type: [DisinheritanceSummaryDto] })
  disinheritanceRecords: DisinheritanceSummaryDto[];

  @ApiProperty()
  isValid: boolean;

  @ApiProperty({ type: [String] })
  validationErrors: string[];
}
