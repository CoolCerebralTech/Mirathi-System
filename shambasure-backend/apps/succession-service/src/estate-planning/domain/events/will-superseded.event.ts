export class WillSupersededEvent {
  constructor(
    public readonly oldWillId: string,
    public readonly newWillId: string, // The will that replaced it
    public readonly testatorId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
