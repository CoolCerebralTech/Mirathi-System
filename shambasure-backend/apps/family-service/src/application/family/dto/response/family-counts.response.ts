// application/family/dto/response/family-counts.response.ts
import { ApiProperty } from '@nestjs/swagger';

export class FamilyCountsResponse {
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @ApiProperty({
    description: 'Family name',
    example: 'Mwangi',
  })
  familyName: string;

  @ApiProperty({
    description: 'Total number of family members',
    example: 25,
  })
  totalMembers: number;

  @ApiProperty({
    description: 'Number of living family members',
    example: 20,
  })
  livingMembers: number;

  @ApiProperty({
    description: 'Number of deceased family members',
    example: 5,
  })
  deceasedMembers: number;

  @ApiProperty({
    description: 'Number of minor family members',
    example: 8,
  })
  minorMembers: number;

  @ApiProperty({
    description: 'Number of dependant family members',
    example: 12,
  })
  dependantMembers: number;

  @ApiProperty({
    description: 'Number of members with verified identity',
    example: 18,
  })
  verifiedIdentityMembers: number;

  @ApiProperty({
    description: 'Number of members with disability',
    example: 3,
  })
  disabledMembers: number;

  @ApiProperty({
    description: 'Number of polygamous houses',
    example: 3,
  })
  polygamousHouses: number;

  @ApiProperty({
    description: 'Number of marriages',
    example: 4,
  })
  marriages: number;

  @ApiProperty({
    description: 'Number of active marriages',
    example: 3,
  })
  activeMarriages: number;

  @ApiProperty({
    description: 'Number of ended marriages',
    example: 1,
  })
  endedMarriages: number;

  @ApiProperty({
    description: 'Number of customary marriages',
    example: 2,
  })
  customaryMarriages: number;

  @ApiProperty({
    description: 'Number of Islamic marriages',
    example: 1,
  })
  islamicMarriages: number;

  @ApiProperty({
    description: 'Number of civil marriages',
    example: 1,
  })
  civilMarriages: number;

  @ApiProperty({
    description: 'Number of Christian marriages',
    example: 0,
  })
  christianMarriages: number;

  @ApiProperty({
    description: 'Average age of family members',
    example: 45.5,
    nullable: true,
  })
  averageAge: number | null;

  @ApiProperty({
    description: 'Number of members requiring identity verification',
    example: 2,
  })
  requiresIdentityVerification: number;

  @ApiProperty({
    description: 'Number of members with missing critical data',
    example: 1,
  })
  missingCriticalData: number;

  @ApiProperty({
    description: 'S.40 compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING'],
  })
  s40ComplianceStatus: string;

  @ApiProperty({
    description: 'S.29 potential claims count',
    example: 5,
  })
  potentialS29Claims: number;

  @ApiProperty({
    description: 'Generation count (depth of family tree)',
    example: 4,
  })
  generations: number;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastUpdated: Date;
}
