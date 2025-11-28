export class WillActivatedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly activatedBy: string, // Added: To track who triggered activation (Testator/Admin)
    public readonly timestamp: Date = new Date(),
  ) {}
}
