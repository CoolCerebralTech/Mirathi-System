// estate-planning/application/commands/assign-beneficiary.command.ts
import { BequestType, BequestConditionType } from '@prisma/client';

export class AssignBeneficiaryCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly assetId: string,
    public readonly beneficiaryType: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL',
    public readonly beneficiaryId?: string, // userId or familyMemberId
    public readonly externalBeneficiary?: {
      name: string;
      contact?: string;
    },
    public readonly bequestType: BequestType,
    public readonly sharePercentage?: number,
    public readonly specificAmount?: number,
    public readonly conditionType: BequestConditionType = BequestConditionType.NONE,
    public readonly conditionDetails?: string,
    public readonly priority: number = 1,
    public readonly relationship?: string,
  ) {}
}
