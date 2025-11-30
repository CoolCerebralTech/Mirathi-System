import { DependencyLevel, InheritanceRights, RelationshipGuardianshipType } from '@prisma/client';

export class RelationshipMetadataUpdatedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly updatedMetadata: Partial<{
      isAdopted?: boolean;
      adoptionOrderNumber?: string;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      clanRelationship?: string;
      traditionalRole?: string;
      isCustomaryAdoption?: boolean;
      adoptionDate?: Date;
      guardianshipType?: RelationshipGuardianshipType;
      courtOrderNumber?: string;
      dependencyLevel?: DependencyLevel;
      inheritanceRights?: InheritanceRights;
      traditionalInheritanceWeight?: number;
    }>,
    public readonly previousMetadata: Record<string, any>,
    public readonly timestamp: Date = new Date(),
  ) {}
}
