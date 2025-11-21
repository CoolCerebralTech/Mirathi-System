import { KenyanFamilyMetadata } from '../entities/family.entity'; // Adjust the path if different

export class FamilyCreatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly ownerId: string, // The User who created the family
    public readonly name: string,
    public readonly metadata: KenyanFamilyMetadata, // Include Kenyan-specific metadata
    public readonly timestamp: Date = new Date(), // Auto timestamp
  ) {}
}
