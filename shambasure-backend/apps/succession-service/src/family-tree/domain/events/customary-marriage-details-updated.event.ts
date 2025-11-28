export class CustomaryMarriageDetailsUpdatedEvent {
  constructor(
    public readonly marriageId: string,
    public readonly familyId: string,
    public readonly customaryDetails: {
      bridePricePaid: boolean;
      bridePriceAmount?: number;
      bridePriceCurrency?: string;
      elderWitnesses: string[];
      ceremonyLocation: string;
      traditionalCeremonyType?: string;
      lobolaReceiptNumber?: string;
      marriageElderContact?: string;
    },
  ) {}

  getEventType(): string {
    return 'CustomaryMarriageDetailsUpdatedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
