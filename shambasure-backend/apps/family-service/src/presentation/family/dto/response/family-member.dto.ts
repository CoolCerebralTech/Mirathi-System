import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender } from '../../../../domain/value-objects/family-enums.vo';

class KinshipLinkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class SpouseLinkDto extends KinshipLinkDto {
  @ApiProperty()
  status: string; // MARRIED, DIVORCED, WIDOWED
}

class LegalStatusDto {
  @ApiProperty()
  isMinor: boolean;

  @ApiProperty()
  hasGuardian: boolean;

  @ApiProperty({ description: 'Qualifies for Section 29 Dependency Claim' })
  qualifiesForS29: boolean;
}

export class FamilyMemberDto {
  @ApiProperty()
  id: string;

  // Core Identity
  @ApiProperty()
  fullName: string;

  @ApiProperty({ description: 'Format: SURNAME, First Middle' })
  officialName: string;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  age?: number;

  // Life Status
  @ApiProperty()
  isAlive: boolean;

  @ApiPropertyOptional()
  deathDate?: Date;

  // Cultural
  @ApiPropertyOptional()
  tribe?: string;

  @ApiPropertyOptional()
  clan?: string;

  // Verification
  @ApiPropertyOptional()
  nationalId?: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  verificationMethod?: string;

  // Kinship Links
  @ApiProperty({ type: [KinshipLinkDto] })
  parents: KinshipLinkDto[];

  @ApiProperty({ type: [SpouseLinkDto] })
  spouses: SpouseLinkDto[];

  @ApiProperty({ type: [KinshipLinkDto] })
  children: KinshipLinkDto[];

  @ApiProperty({ type: [KinshipLinkDto] })
  siblings: KinshipLinkDto[];

  // Legal
  @ApiProperty({ type: LegalStatusDto })
  legalStatus: LegalStatusDto;
}
