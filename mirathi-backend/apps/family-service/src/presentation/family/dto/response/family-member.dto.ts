import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Gender } from '../../../../domain/value-objects/family-enums.vo';

class KinshipLinkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class ParentLinkDto extends KinshipLinkDto {
  @ApiProperty({ enum: ['BIOLOGICAL', 'ADOPTIVE', 'FOSTER', 'STEP'] })
  relationshipType: string;

  @ApiProperty()
  isAlive: boolean;
}

class SpouseLinkDto extends KinshipLinkDto {
  @ApiProperty()
  marriageType: string;

  @ApiProperty()
  status: string; // MARRIED, DIVORCED, WIDOWED

  @ApiPropertyOptional()
  dateOfMarriage?: Date;
}

class ChildLinkDto extends KinshipLinkDto {
  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional()
  age?: number;
}

class SiblingLinkDto extends KinshipLinkDto {
  @ApiProperty({ enum: ['FULL', 'HALF', 'STEP'] })
  type: string;
}

class PolygamyContextDto {
  @ApiProperty()
  isPolygamousFamily: boolean;

  @ApiPropertyOptional()
  belongsToHouseId?: string;

  @ApiPropertyOptional()
  belongsToHouseName?: string;

  @ApiProperty()
  isHouseHead: boolean;
}

class LegalStatusDto {
  @ApiProperty()
  isMinor: boolean;

  @ApiProperty()
  isAdult: boolean;

  @ApiProperty()
  hasGuardian: boolean;

  @ApiProperty({ description: 'Qualifies for Section 29 Dependency Claim' })
  qualifiesForS29: boolean;

  @ApiProperty({ enum: ['FULL', 'LIMITED', 'NONE', 'PENDING_VERIFICATION'] })
  inheritanceEligibility: string;
}

export class FamilyMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  familyId: string;

  // Identity
  @ApiProperty()
  identity: {
    fullName: string;
    officialName: string;
    first: string;
    last: string;
    gender: Gender;
    dateOfBirth?: Date;
    age?: number;
    nationalId?: string;
  };

  // Vital Status
  @ApiProperty()
  vitalStatus: {
    isAlive: boolean;
    dateOfDeath?: Date;
    isMissing: boolean;
  };

  // Cultural
  @ApiProperty()
  context: {
    tribe?: string;
    clan?: string;
    homeCounty?: string;
    placeOfBirth?: string;
  };

  // Verification
  @ApiProperty()
  verification: {
    isVerified: boolean;
    status: string;
    method?: string;
    confidenceScore?: number;
  };

  // Kinship
  @ApiProperty()
  kinship: {
    parents: ParentLinkDto[];
    spouses: SpouseLinkDto[];
    children: ChildLinkDto[];
    siblings: SiblingLinkDto[];
  };

  // Polygamy
  @ApiProperty({ type: PolygamyContextDto })
  polygamyContext: PolygamyContextDto;

  // Legal
  @ApiProperty({ type: LegalStatusDto })
  legalStatus: LegalStatusDto;
}
