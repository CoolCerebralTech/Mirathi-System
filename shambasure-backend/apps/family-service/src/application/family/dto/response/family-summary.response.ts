import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// application/family/dto/response/family-summary.response.ts
export class FamilySummaryResponse {
  @ApiProperty({ example: 'fam-1234567890' })
  id: string;

  @ApiProperty({ example: 'Mwangi' })
  name: string;

  @ApiPropertyOptional({ example: 'Anjirũ' })
  clanName?: string;

  @ApiPropertyOptional({ example: 'KIAMBU' })
  homeCounty?: string;

  @ApiProperty({ example: 25 })
  memberCount: number;

  @ApiProperty({ example: true })
  isPolygamous: boolean;

  @ApiProperty({ example: 3 })
  polygamousHouseCount: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiProperty({ example: '2020-01-15T10:30:00.000Z' })
  createdAt: Date;
}
