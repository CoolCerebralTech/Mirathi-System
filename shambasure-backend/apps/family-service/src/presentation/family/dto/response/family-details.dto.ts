import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

export class FamilyStatsDto {
  @ApiProperty()
  totalMembers: number;

  @ApiProperty()
  livingMembers: number;

  @ApiProperty()
  deceasedMembers: number;

  @ApiProperty()
  verifiedMembers: number;

  @ApiProperty()
  generationsCount: number;
}

export class FamilyStructureDto {
  @ApiProperty({
    enum: ['NUCLEAR', 'EXTENDED', 'POLYGAMOUS', 'SINGLE_PARENT', 'BLENDED', 'COMPLEX'],
  })
  type: string;

  @ApiProperty()
  houseCount: number;

  @ApiProperty()
  isS40Compliant: boolean;
}

export class RecentEventDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  actorName: string;

  @ApiProperty()
  type: string;
}

export class FamilyDetailsDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: KenyanCounty })
  county: KenyanCounty | string;

  @ApiPropertyOptional()
  clanName?: string;

  @ApiProperty({ type: FamilyStatsDto })
  stats: FamilyStatsDto;

  @ApiProperty({ type: FamilyStructureDto })
  structure: FamilyStructureDto;

  @ApiProperty({ type: [RecentEventDto] })
  recentEvents: RecentEventDto[];

  @ApiProperty({ description: '0-100 score indicating data quality' })
  completenessScore: number;
}
