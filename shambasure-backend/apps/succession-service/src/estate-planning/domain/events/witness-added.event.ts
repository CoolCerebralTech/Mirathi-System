import { WitnessType } from '@prisma/client';

export class WitnessAddedEvent {
  constructor(
    public readonly witnessId: string, // The ID of the Witness entity (will_witnesses row)
    public readonly willId: string,
    public readonly witnessType: WitnessType,
    public readonly witnessUserId: string | null, // Linked User ID (if registered)
    public readonly fullName: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
