// application/family/dto/response/family-tree.response.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FamilyTreeNodeResponse {
  @ApiProperty({
    description: 'Family member ID',
    example: 'fm-1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Kamau Mwangi',
  })
  name: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Mwangi',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Middle name',
    example: 'Kamau',
  })
  middleName?: string;

  @ApiPropertyOptional({
    description: 'Maiden name',
    example: 'Wanjiru',
  })
  maidenName?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'MALE',
  })
  gender: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15T00:00:00.000Z',
  })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Current age',
    example: 34,
  })
  age: number;

  @ApiProperty({
    description: 'Whether deceased',
    example: false,
  })
  isDeceased: boolean;

  @ApiPropertyOptional({
    description: 'Date of death if deceased',
    example: null,
  })
  dateOfDeath?: Date;

  @ApiProperty({
    description: 'Whether member is a minor',
    example: false,
  })
  isMinor: boolean;

  @ApiProperty({
    description: 'Whether member has disability',
    example: false,
  })
  hasDisability: boolean;

  @ApiPropertyOptional({
    description: 'Photo URL',
    example: 'https://example.com/photos/john.jpg',
  })
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Occupation',
    example: 'Software Engineer',
  })
  occupation?: string;

  @ApiProperty({
    description: 'Generation number (0 = root)',
    example: 2,
  })
  generation: number;

  @ApiProperty({
    description: 'Tree node depth',
    example: 2,
  })
  depth: number;

  @ApiProperty({
    description: 'X position for tree visualization',
    example: 100,
  })
  x: number;

  @ApiProperty({
    description: 'Y position for tree visualization',
    example: 200,
  })
  y: number;

  @ApiProperty({
    description: 'Node width for tree visualization',
    example: 200,
  })
  width: number;

  @ApiProperty({
    description: 'Node height for tree visualization',
    example: 60,
  })
  height: number;

  @ApiProperty({
    description: 'Spouse nodes',
    type: () => FamilyTreeNodeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeNodeResponse)
  spouses: FamilyTreeNodeResponse[];

  @ApiProperty({
    description: 'Children nodes',
    type: () => FamilyTreeNodeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeNodeResponse)
  children: FamilyTreeNodeResponse[];

  @ApiPropertyOptional({
    description: 'Parent nodes',
    type: () => FamilyTreeNodeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeNodeResponse)
  parents?: FamilyTreeNodeResponse[];

  @ApiPropertyOptional({
    description: 'Sibling nodes',
    type: () => FamilyTreeNodeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeNodeResponse)
  siblings?: FamilyTreeNodeResponse[];

  @ApiProperty({
    description: 'Whether node is expanded in tree view',
    example: true,
  })
  isExpanded: boolean;

  @ApiProperty({
    description: 'Relationship type to root',
    example: 'CHILD',
    enum: [
      'ROOT',
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'GRANDCHILD',
      'GRANDPARENT',
      'AUNT_UNCLE',
      'NIECE_NEPHEW',
      'COUSIN',
    ],
  })
  relationshipToRoot: string;
}

export class FamilyTreeEdgeResponse {
  @ApiProperty({
    description: 'Source node ID',
    example: 'fm-1234567890',
  })
  source: string;

  @ApiProperty({
    description: 'Target node ID',
    example: 'fm-0987654321',
  })
  target: string;

  @ApiProperty({
    description: 'Relationship type',
    example: 'MARRIAGE',
    enum: ['MARRIAGE', 'PARENT_CHILD', 'SIBLING', 'ADOPTION', 'CUSTOMARY'],
  })
  type: string;

  @ApiProperty({
    description: 'Marriage ID if type is MARRIAGE',
    example: 'mrr-1234567890',
  })
  marriageId?: string;

  @ApiProperty({
    description: 'Whether relationship is biological',
    example: true,
  })
  isBiological: boolean;

  @ApiProperty({
    description: 'Edge label for visualization',
    example: 'Married 2020',
  })
  label: string;
}

export class FamilyTreeResponse {
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
    description: 'Root member ID (usually oldest known ancestor)',
    example: 'fm-1234567890',
  })
  rootMemberId: string;

  @ApiProperty({
    description: 'Tree generation depth',
    example: 5,
  })
  maxDepth: number;

  @ApiProperty({
    description: 'Total nodes in tree',
    example: 45,
  })
  totalNodes: number;

  @ApiProperty({
    description: 'Total marriages in tree',
    example: 12,
  })
  totalMarriages: number;

  @ApiProperty({
    description: 'Total living members in tree',
    example: 38,
  })
  livingMembers: number;

  @ApiProperty({
    description: 'Total deceased members in tree',
    example: 7,
  })
  deceasedMembers: number;

  @ApiProperty({
    description: 'Tree nodes',
    type: () => FamilyTreeNodeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeNodeResponse)
  nodes: FamilyTreeNodeResponse[];

  @ApiProperty({
    description: 'Tree edges (relationships)',
    type: () => FamilyTreeEdgeResponse,
    isArray: true,
  })
  @Type(() => FamilyTreeEdgeResponse)
  edges: FamilyTreeEdgeResponse[];

  @ApiProperty({
    description: 'Generation statistics',
    example: [
      { generation: 1, count: 2, averageAge: 75 },
      { generation: 2, count: 5, averageAge: 50 },
      { generation: 3, count: 15, averageAge: 30 },
      { generation: 4, count: 20, averageAge: 10 },
    ],
  })
  generations: Array<{
    generation: number;
    count: number;
    averageAge: number;
    livingCount: number;
    deceasedCount: number;
  }>;

  @ApiProperty({
    description: 'Family tree visualization configuration',
    example: {
      orientation: 'HORIZONTAL',
      nodeWidth: 200,
      nodeHeight: 60,
      nodeSpacing: 50,
      layerSpacing: 100,
    },
  })
  visualizationConfig: {
    orientation: 'HORIZONTAL' | 'VERTICAL';
    nodeWidth: number;
    nodeHeight: number;
    nodeSpacing: number;
    layerSpacing: number;
  };

  @ApiProperty({
    description: 'Tree creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Tree version',
    example: '2.0',
  })
  version: string;
}
