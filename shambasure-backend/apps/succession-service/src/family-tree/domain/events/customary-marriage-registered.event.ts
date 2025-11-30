export class CustomaryMarriageRegisteredEvent {
  constructor(
    public readonly familyId: string,
    public readonly marriageDetails: {
      spouse1Id: string;
      spouse2Id: string;
      marriageDate: Date;
      elderWitnesses: string[];
      bridePricePaid: boolean;
      ceremonyLocation: string;
      // Optional details useful for the Read Model
      bridePriceAmount?: number;
      traditionalCeremonyType?: string;
      clanApproval?: boolean;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
