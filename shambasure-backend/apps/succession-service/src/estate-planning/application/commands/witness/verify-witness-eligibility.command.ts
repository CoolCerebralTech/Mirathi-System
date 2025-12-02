// verify-witness-eligibility.command.ts
import { WitnessEligibilityStatus } from '@prisma/client';

export class VerifyWitnessEligibilityCommand {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly eligibilityStatus: WitnessEligibilityStatus,
    public readonly verifiedBy: string,
    public readonly ineligibilityReason?: string,
  ) {}
}
