export class WitnessAddedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly witnessInfo: {
      userId?: string;
      fullName: string;
      email?: string; // Critical for sending invitations
      phone?: string; // Critical for sending invitations
    },
    public readonly type: 'USER' | 'EXTERNAL',
    public readonly timestamp: Date = new Date(),
  ) {}
}
