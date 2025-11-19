import { BequestType } from '@prisma/client';

export class BeneficiaryAssignedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string, // The ID of the assignment entity
    public readonly willId: string,
    public readonly assetId: string,
    // Matches BeneficiaryIdentity interface
    public readonly identity: {
      userId?: string;
      familyMemberId?: string;
      externalName?: string;
      relationship?: string;
    },
    public readonly bequestType: BequestType,
    public readonly timestamp: Date = new Date(),
  ) {}
}
