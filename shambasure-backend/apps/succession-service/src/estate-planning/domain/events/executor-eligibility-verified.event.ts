import { ExecutorEligibilityStatus } from '@prisma/client';

export class ExecutorEligibilityVerifiedEvent {
  constructor(
    public readonly executorId: string, // The ID of the Executor entity (will_executors row)
    public readonly willId: string,
    public readonly status: ExecutorEligibilityStatus,
    public readonly verifiedBy: string, // User ID of the verifier
    public readonly verifiedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
