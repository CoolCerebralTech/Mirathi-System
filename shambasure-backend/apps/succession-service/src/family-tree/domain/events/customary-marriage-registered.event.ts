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
      marriageType: 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC';
      lobolaAmount?: number;
      lobolaCurrency?: string;
      traditionalCeremonyType?: string; // e.g., 'Kikuyu', 'Luo', 'Kalenjin'
    },
  ) {}

  getEventType(): string {
    return 'CustomaryMarriageRegisteredEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
