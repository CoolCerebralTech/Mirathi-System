import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GuardianshipStatus } from '../../../../domain/aggregates/guardianship.aggregate';

class WardSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() age: number;
  @ApiProperty() dateOfBirth: Date;
  @ApiProperty() gender: string;
  @ApiPropertyOptional() photoUrl?: string;
}

class LegalContextDto {
  @ApiProperty() type: string; // e.g., "Testamentary"
  @ApiProperty() jurisdiction: string;
  @ApiPropertyOptional() courtStation?: string;
  @ApiPropertyOptional() judgeName?: string;
  @ApiPropertyOptional() orderDate?: Date;
}

class GuardianSummaryDto {
  @ApiProperty() guardianId: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty() status: string;
  @ApiProperty() contactPhone: string;
  @ApiProperty() relationshipToWard: string;
}

class ComplianceStatusDto {
  @ApiProperty({ description: 'Compliance Health Score (0-100)' })
  score: number;

  @ApiProperty() nextReportDue: Date;

  @ApiPropertyOptional() lastReportDate?: Date;

  @ApiProperty({ description: 'Is a Section 72 security bond active?' })
  isBonded: boolean;
}

export class GuardianshipDetailsResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() caseNumber: string;

  @ApiProperty({ enum: GuardianshipStatus })
  status: GuardianshipStatus;

  @ApiProperty({ type: WardSummaryDto })
  ward: WardSummaryDto;

  @ApiProperty({ type: LegalContextDto })
  legal: LegalContextDto;

  @ApiProperty({ type: [GuardianSummaryDto] })
  guardians: GuardianSummaryDto[];

  @ApiProperty({ type: ComplianceStatusDto })
  compliance: ComplianceStatusDto;
}
