import { RevocationMethod } from '@prisma/client';

export class WillRevokedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly reason: string,
    public readonly revokedBy: string,
    public readonly revocationMethod: RevocationMethod, // Strictly typed Enum
    public readonly timestamp: Date = new Date(),
  ) {}
}
