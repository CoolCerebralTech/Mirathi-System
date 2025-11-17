import { RelationshipType } from '@prisma/client';

export interface RelationshipMetadata {
  isBloodRelative: boolean;
  isLegalRelationship: boolean;
  isCustomaryRelationship: boolean;
  inheritanceRights: 'FULL' | 'PARTIAL' | 'NONE' | 'DEPENDENT';
  culturalSignificance: string[];
  legalRequirements?: string[];
}

export class KenyanRelationship {
  private readonly relationshipType: RelationshipType;
  private readonly metadata: RelationshipMetadata;

  constructor(relationshipType: RelationshipType, metadata?: Partial<RelationshipMetadata>) {
    this.relationshipType = relationshipType;
    this.metadata = {
      isBloodRelative: this.determineBloodRelation(relationshipType),
      isLegalRelationship: this.determineLegalStatus(relationshipType),
      isCustomaryRelationship: this.determineCustomaryStatus(relationshipType),
      inheritanceRights: this.determineInheritanceRights(relationshipType),
      culturalSignificance: this.determineCulturalSignificance(relationshipType),
      legalRequirements: this.determineLegalRequirements(relationshipType),
      ...metadata,
    };
  }

  getRelationshipType(): RelationshipType {
    return this.relationshipType;
  }

  getMetadata(): Readonly<RelationshipMetadata> {
    return { ...this.metadata };
  }

  equals(other: KenyanRelationship): boolean {
    return this.relationshipType === other.getRelationshipType();
  }

  toString(): string {
    return this.relationshipType;
  }

  // Kenyan-specific business logic
  hasInheritanceRightsUnderIntestacy(): boolean {
    return this.metadata.inheritanceRights !== 'NONE';
  }

  isDependantUnderKenyanLaw(): boolean {
    const dependantRelationships: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];
    return dependantRelationships.includes(this.relationshipType);
  }

  requiresLegalDocumentation(): boolean {
    const relationshipsRequiringDocs: RelationshipType[] = [
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.GUARDIAN,
      RelationshipType.SPOUSE, // For marriage certificate
    ];
    return relationshipsRequiringDocs.includes(this.relationshipType);
  }

  // Private determination methods
  private determineBloodRelation(relationshipType: RelationshipType): boolean {
    const bloodRelations: RelationshipType[] = [
      RelationshipType.CHILD,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.HALF_SIBLING,
      RelationshipType.GRANDCHILD,
      RelationshipType.GRANDPARENT,
      RelationshipType.NIECE_NEPHEW,
      RelationshipType.AUNT_UNCLE,
      RelationshipType.COUSIN,
    ];
    return bloodRelations.includes(relationshipType);
  }

  private determineLegalStatus(relationshipType: RelationshipType): boolean {
    const legalRelationships: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.GUARDIAN,
    ];
    return legalRelationships.includes(relationshipType);
  }

  private determineCustomaryStatus(relationshipType: RelationshipType): boolean {
    // In Kenyan context, some relationships have customary recognition
    const customaryRelationships: RelationshipType[] = [
      RelationshipType.SPOUSE, // Customary marriages
      RelationshipType.CHILD, // Customary adoption
      RelationshipType.OTHER, // Customary relationships
    ];
    return customaryRelationships.includes(relationshipType);
  }

  private determineInheritanceRights(
    relationshipType: RelationshipType,
  ): 'FULL' | 'PARTIAL' | 'NONE' | 'DEPENDENT' {
    const inheritanceMap: Record<RelationshipType, 'FULL' | 'PARTIAL' | 'NONE' | 'DEPENDENT'> = {
      [RelationshipType.SPOUSE]: 'FULL',
      [RelationshipType.CHILD]: 'FULL',
      [RelationshipType.ADOPTED_CHILD]: 'FULL',
      [RelationshipType.STEPCHILD]: 'PARTIAL',
      [RelationshipType.PARENT]: 'DEPENDENT',
      [RelationshipType.SIBLING]: 'PARTIAL',
      [RelationshipType.HALF_SIBLING]: 'PARTIAL',
      [RelationshipType.GRANDCHILD]: 'PARTIAL',
      [RelationshipType.GRANDPARENT]: 'DEPENDENT',
      [RelationshipType.NIECE_NEPHEW]: 'NONE',
      [RelationshipType.AUNT_UNCLE]: 'NONE',
      [RelationshipType.COUSIN]: 'NONE',
      [RelationshipType.GUARDIAN]: 'NONE',
      [RelationshipType.OTHER]: 'NONE',
      [RelationshipType.EX_SPOUSE]: 'NONE',
    };

    return inheritanceMap[relationshipType];
  }

  private determineCulturalSignificance(relationshipType: RelationshipType): string[] {
    const culturalAspects: Record<RelationshipType, string[]> = {
      [RelationshipType.SPOUSE]: ['Family continuity', 'Social status', 'Economic partnership'],
      [RelationshipType.CHILD]: ['Family legacy', 'Lineage continuation', 'Old age support'],
      [RelationshipType.ADOPTED_CHILD]: ['Family expansion', 'Social responsibility'],
      [RelationshipType.STEPCHILD]: ['Blended family integration'],
      [RelationshipType.PARENT]: ['Family authority', 'Cultural transmission'],
      [RelationshipType.SIBLING]: ['Family solidarity', 'Mutual support'],
      [RelationshipType.GRANDCHILD]: ['Family extension', 'Generational connection'],
      [RelationshipType.GUARDIAN]: ['Child welfare', 'Family responsibility'],
      [RelationshipType.OTHER]: ['Community ties', 'Social networks'],
    };

    return culturalAspects[relationshipType] || [];
  }

  private determineLegalRequirements(relationshipType: RelationshipType): string[] {
    const requirements: Record<RelationshipType, string[]> = {
      [RelationshipType.SPOUSE]: ['Marriage certificate', 'Consent for polygamous marriage'],
      [RelationshipType.ADOPTED_CHILD]: ['Adoption certificate', 'Court order'],
      [RelationshipType.GUARDIAN]: ['Guardianship order', 'Court appointment'],
      [RelationshipType.STEPCHILD]: ['Marriage certificate of parents', 'Proof of dependency'],
    };

    return requirements[relationshipType] || [];
  }

  // Static factory methods for common relationships
  static createSpouseRelationship(): KenyanRelationship {
    return new KenyanRelationship(RelationshipType.SPOUSE);
  }

  static createChildRelationship(): KenyanRelationship {
    return new KenyanRelationship(RelationshipType.CHILD);
  }

  static createParentRelationship(): KenyanRelationship {
    return new KenyanRelationship(RelationshipType.PARENT);
  }

  static createSiblingRelationship(): KenyanRelationship {
    return new KenyanRelationship(RelationshipType.SIBLING);
  }
}
