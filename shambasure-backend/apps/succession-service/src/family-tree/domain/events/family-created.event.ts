export class FamilyCreatedEvent {
  constructor(
    public readonly familyId: string,
    public readonly creatorId: string, // Aligned with Prisma 'creatorId'
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
