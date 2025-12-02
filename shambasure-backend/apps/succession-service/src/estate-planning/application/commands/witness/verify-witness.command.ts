// verify-witness.command.ts
import { WitnessVerificationMethod } from '@prisma/client';

export class VerifyWitnessCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly verifiedBy: string,
    public readonly verificationMethod: WitnessVerificationMethod,
    public readonly verificationNotes?: string,
  ) {}
}
