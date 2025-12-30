import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty()
  potentialDependents: number;
}

export class FamilyStructureDto {
  @ApiProperty({
    enum: ['NUCLEAR', 'EXTENDED', 'POLYGAMOUS', 'SINGLE_PARENT', 'BLENDED', 'COMPLEX', 'UNKNOWN'],
  })
  type: string;

  @ApiProperty()
  houseCount: number;

  @ApiProperty()
  isS40Compliant: boolean;

  @ApiProperty({ enum: ['MONOGAMOUS', 'POLYGAMOUS', 'POTENTIALLY_POLYGAMOUS'] })
  polygamyStatus: string;
}

export class RecentEventDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  actorName: string;

  @ApiProperty()
  type: string;
}

export class CompletenessDto {
  @ApiProperty()
  score: number;

  @ApiProperty()
  missingFieldsCount: number;

  @ApiPropertyOptional()
  nextRecommendedAction?: {
    title: string;
    route: string;
    reason: string;
  };
}

export class FamilyDetailsDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  county: string; // Simplified to string to avoid Enum union errors

  @ApiPropertyOptional()
  clanName?: string;

  @ApiPropertyOptional()
  totem?: string;

  @ApiProperty({ type: FamilyStatsDto })
  stats: FamilyStatsDto;

  @ApiProperty({ type: FamilyStructureDto })
  structure: FamilyStructureDto;

  @ApiProperty({ type: [RecentEventDto] })
  recentEvents: RecentEventDto[];

  @ApiProperty({ type: CompletenessDto })
  completeness: CompletenessDto;
}
