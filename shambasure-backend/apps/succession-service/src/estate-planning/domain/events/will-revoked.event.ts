export class WillRevokedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly reason: string | null,
    public readonly revokedBy: string, // Added to track who performed the action
    public readonly revocationMethod: 'NEW_WILL' | 'CODICIL' | 'DESTRUCTION' | 'COURT_ORDER', // Added context
    public readonly timestamp: Date = new Date(),
  ) {}
}
