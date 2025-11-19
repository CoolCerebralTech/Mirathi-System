export class WillContestedEvent {
  constructor(
    public readonly willId: string,
    public readonly disputeId: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
