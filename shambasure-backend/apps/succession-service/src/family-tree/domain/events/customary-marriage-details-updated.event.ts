export class CustomaryMarriageDetailsUpdatedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly customaryDetails: {
      bridePricePaid: boolean;
      bridePriceAmount?: number | null;
      bridePriceCurrency?: string | null;
      elderWitnesses: string[];
      ceremonyLocation?: string | null;
      traditionalCeremonyType?: string | null;
      lobolaReceiptNumber?: string | null;
      marriageElderContact?: string | null;
      // Added fields matching Aggregate emission
      clanApproval: boolean;
      familyConsent: boolean;
      traditionalRitesPerformed: string[];
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
