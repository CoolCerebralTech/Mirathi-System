// application/family/dto/response/family-search.response.ts
import { ApiProperty } from '@nestjs/swagger';

import { PaginatedResponse } from './base.response';
import { FamilyResponse } from './family.response';

export class FamilySearchResponse extends PaginatedResponse<FamilyResponse> {
  @ApiProperty({
    description: 'Search query used',
    example: 'name=Mwangi&county=KIAMBU',
  })
  query: string;

  @ApiProperty({
    description: 'Search filters applied',
    example: {
      name: 'Mwangi',
      county: 'KIAMBU',
      isPolygamous: false,
    },
  })
  filters: Record<string, any>;

  @ApiProperty({
    description: 'Total active families',
    example: 1000,
  })
  totalActiveFamilies: number;

  @ApiProperty({
    description: 'Total polygamous families',
    example: 150,
  })
  totalPolygamousFamilies: number;

  @ApiProperty({
    description: 'Average family size',
    example: 8.5,
  })
  averageFamilySize: number;

  @ApiProperty({
    description: 'Total families by county',
    example: {
      KIAMBU: 200,
      NAIROBI: 150,
      NAKURU: 100,
    },
  })
  familiesByCounty: Record<string, number>;

  @ApiProperty({
    description: 'Search execution time in milliseconds',
    example: 150,
  })
  executionTimeMs: number;
}
