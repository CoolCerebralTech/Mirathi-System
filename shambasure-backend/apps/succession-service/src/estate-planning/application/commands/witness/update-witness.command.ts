// update-witness.command.ts
import { WitnessVerificationMethod } from '@prisma/client';

export class UpdateWitnessCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly updates: {
      fullName?: string;
      email?: string;
      phone?: string;
      relationship?: string;
      relationshipDuration?: string;
      residentialCounty?: string;
      updateReason?: string;
    },
  ) {}
}
