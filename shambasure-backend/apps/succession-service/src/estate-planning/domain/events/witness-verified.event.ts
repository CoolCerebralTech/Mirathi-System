import { WitnessVerificationMethod } from '@prisma/client';

export class WitnessVerifiedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly verifiedBy: string, // User ID of the verifier
    public readonly verifiedAt: Date,
    public readonly verificationMethod: WitnessVerificationMethod,
    public readonly timestamp: Date = new Date(),
  ) {}
}
