import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FamilyTreeNodeDto {
  @Expose() id: string;
  @Expose() label: string; // Full Name
  @Expose() type: string; // 'MEMBER'
  @Expose() role: string; // Relationship to Root
  @Expose() data: {
    isDeceased: boolean;
    isMinor: boolean;
    hasIssues: boolean; // e.g., Missing dates
    gender?: string; // If captured
    avatarUrl?: string;
  };
}

@Exclude()
export class FamilyTreeEdgeDto {
  @Expose() id: string;
  @Expose() source: string;
  @Expose() target: string;
  @Expose() type: 'BLOOD' | 'MARRIAGE';
  @Expose() label: string; // e.g. 'married', 'child_of'
  @Expose() animated?: boolean; // UI hint
}

@Exclude()
export class FamilyTreeResponseDto {
  @Expose()
  familyId: string;

  @Expose()
  nodes: FamilyTreeNodeDto[];

  @Expose()
  edges: FamilyTreeEdgeDto[];

  @Expose()
  stats: {
    memberCount: number;
    generationCount: number; // Calculated depth
  };
}
