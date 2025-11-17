export class WillRevokedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly reason: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
