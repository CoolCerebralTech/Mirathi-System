// application/family/dto/response/family.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KenyanCounty } from '@prisma/client';

import { BaseResponse } from './base.response';

export class FamilyResponse extends BaseResponse {
  @ApiProperty({
    description: 'Family name/surname',
    example: 'Mwangi',
  })
  name: string;

  @ApiProperty({
    description: 'User ID of the family creator',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId: string;

  @ApiPropertyOptional({
    description: 'Family description or history',
    example: 'Descendants of Chief Waiyaki wa Hinga',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Clan name (Mũhĩrĩga)',
    example: 'Anjirũ',
  })
  clanName?: string;

  @ApiPropertyOptional({
    description: 'Sub-clan name',
    example: 'Mũcemanio',
  })
  subClan?: string;

  @ApiPropertyOptional({
    description: 'Ancestral home or Mũgũrũ wa baba',
    example: 'Gatũndũ, Kiambu County',
  })
  ancestralHome?: string;

  @ApiPropertyOptional({
    description: 'Family totem or symbol',
    example: 'Ngũ (Leopard)',
  })
  familyTotem?: string;

  @ApiPropertyOptional({
    description: 'Home county for legal jurisdiction',
    enum: KenyanCounty,
    example: KenyanCounty.KIAMBU,
  })
  homeCounty?: KenyanCounty;

  @ApiPropertyOptional({
    description: 'Sub-county within the county',
    example: 'Gatundu North',
  })
  subCounty?: string;

  @ApiPropertyOptional({
    description: 'Ward within the sub-county',
    example: 'Gatundu',
  })
  ward?: string;

  @ApiPropertyOptional({
    description: 'Village or estate',
    example: 'Kiamwangi',
  })
  village?: string;

  @ApiPropertyOptional({
    description: 'Specific place name',
    example: 'Waiyaki Family Homestead',
  })
  placeName?: string;

  @ApiProperty({
    description: 'Total number of family members',
    example: 25,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Number of living family members',
    example: 20,
  })
  livingMemberCount: number;

  @ApiProperty({
    description: 'Number of deceased family members',
    example: 5,
  })
  deceasedMemberCount: number;

  @ApiProperty({
    description: 'Number of minor family members',
    example: 8,
  })
  minorCount: number;

  @ApiProperty({
    description: 'Number of dependant family members',
    example: 12,
  })
  dependantCount: number;

  @ApiProperty({
    description: 'Whether the family is polygamous',
    example: true,
  })
  isPolygamous: boolean;

  @ApiProperty({
    description: 'Number of polygamous houses',
    example: 3,
  })
  polygamousHouseCount: number;

  @ApiProperty({
    description: 'Whether the family has living members',
    example: true,
  })
  hasLivingMembers: boolean;

  @ApiProperty({
    description: 'Whether the family has deceased members',
    example: true,
  })
  hasDeceasedMembers: boolean;

  @ApiProperty({
    description: 'Whether the family has minors',
    example: true,
  })
  hasMinors: boolean;

  @ApiProperty({
    description: 'Whether the family has dependants',
    example: true,
  })
  hasDependants: boolean;

  @ApiProperty({
    description: 'Whether the family is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'S.40 Polygamy compliance status',
    example: true,
  })
  isS40Compliant: boolean;

  @ApiProperty({
    description: 'Potential S.29 dependant claims',
    example: true,
  })
  hasPotentialS29Claims: boolean;

  @ApiProperty({
    description: 'Whether the family is archived',
    example: false,
  })
  isArchived: boolean;

  @ApiPropertyOptional({
    description: 'Deletion timestamp if archived',
    example: null,
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'User who archived the family',
    example: null,
  })
  deletedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for archiving',
    example: null,
  })
  deletionReason?: string;

  @ApiProperty({
    description: 'Optimistic locking version',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: 'Last processed event ID',
    example: 'event-1234567890',
  })
  lastEventId?: string;

  @ApiProperty({
    description: 'Array of member IDs (denormalized for quick access)',
    example: ['fm-1234567890', 'fm-0987654321'],
    type: [String],
  })
  memberIds: string[];

  @ApiProperty({
    description: 'Array of marriage IDs',
    example: ['mrr-1234567890', 'mrr-0987654321'],
    type: [String],
  })
  marriageIds: string[];

  @ApiProperty({
    description: 'Array of polygamous house IDs',
    example: ['hse-1234567890', 'hse-0987654321'],
    type: [String],
  })
  polygamousHouseIds: string[];
}
