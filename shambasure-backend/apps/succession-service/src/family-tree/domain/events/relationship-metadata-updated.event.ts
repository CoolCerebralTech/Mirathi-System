export class RelationshipMetadataUpdatedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly updatedMetadata: Partial<{
      isAdopted?: boolean;
      adoptionOrderNumber?: string;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      isCustomaryAdoption?: boolean;
      guardianshipType?: 'TEMPORARY' | 'PERMANENT' | 'TESTAMENTARY';
      courtOrderNumber?: string;
    }>,
    public readonly previousMetadata: {
      isAdopted?: boolean;
      adoptionOrderNumber?: string;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      isCustomaryAdoption?: boolean;
      guardianshipType?: 'TEMPORARY' | 'PERMANENT' | 'TESTAMENTARY';
      courtOrderNumber?: string;
    },
  ) {}

  getEventType(): string {
    return 'RelationshipMetadataUpdatedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
