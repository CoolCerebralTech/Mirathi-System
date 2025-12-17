import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// application/family/dto/response/family-tree-node.response.ts (if not already created separately)
export class FamilyTreeNodeResponse {
  // We already created this within FamilyTreeResponse, but if needed separately:
  @ApiProperty({ example: 'fm-1234567890' })
  id: string;

  @ApiProperty({ example: 'John Kamau Mwangi' })
  name: string;

  @ApiProperty({ example: 'MALE' })
  gender: string;

  @ApiProperty({ example: false })
  isDeceased: boolean;

  @ApiProperty({ example: 34 })
  age: number;

  @ApiProperty({ example: 2 })
  generation: number;

  @ApiProperty({ example: ['fm-0987654321'] })
  spouseIds: string[];

  @ApiProperty({ example: ['fm-2345678901', 'fm-3456789012'] })
  childrenIds: string[];

  @ApiPropertyOptional({ example: ['fm-4567890123'] })
  parentIds?: string[];
}
